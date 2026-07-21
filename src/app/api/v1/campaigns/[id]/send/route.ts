import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, LeadStatus, LeadSource, StudentStatus, EnrollmentStatus, CampaignStatus, CampaignChannel } from '@prisma/client'
import { asEnum } from '@/lib/api/query'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { forOrg } from '@/lib/db'
import { sendCampaignMessage } from '@/lib/campaign/sendCampaignMessage'
import { mintCampaignInstance } from '@/lib/forms/send'
import { spendCreditsWithIntent, confirmSpendIntent, refundCredits, InsufficientCreditsError } from '@/lib/credits/engine'
import { getActiveProviderConfig } from '@/lib/credits/provider'
import { emailMonthlyLimit, emailDailyLimit, ADDON_DAILY_CAP, startOfDayIST } from '@/lib/campaign/limits'
import { resolveOrgCampaignFrom } from '@/lib/campaign/sendingDomain'
import { checkEmailDeliverabilityGuard } from '@/lib/campaign/deliverability'
import type { MessageChannel } from '@prisma/client'

const sendConfigSchema = z.object({
  scheduledAt: z.string().optional().nullable()
})

// Shared core sending handler
async function handleSendCampaign({
  campaign,
  db,
  orgId,
  userId,
  reqBody
}: {
  campaign: any
  db: ReturnType<typeof forOrg>
  orgId: string
  userId: string | null
  reqBody: any
}) {
  // STEP 1 — Fetch check status
  if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
    return NextResponse.json(
      { success: false, error: 'Only draft or scheduled campaigns can be sent' },
      { status: 400 }
    )
  }

  // STEP 2 — Plan quota (EMAIL only; SMS/WhatsApp are credit-metered below)
  const isCreditChannel =
    campaign.channel === CampaignChannel.SMS ||
    campaign.channel === CampaignChannel.WHATSAPP
  const creditChannel: MessageChannel =
    campaign.channel === CampaignChannel.WHATSAPP ? 'WHATSAPP' : 'SMS'

  let emailRemaining = Infinity
  let emailDailyRemaining = Infinity
  if (!isCreditChannel) {
    // Auto-pause guardrail — block email sends when recent bounce/complaint
    // rates breach shared-domain-safe thresholds.
    const guard = await checkEmailDeliverabilityGuard(db, orgId)
    if (guard.blocked) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 })
    }

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const dayStart = startOfDayIST(now)

    const [used, usedToday] = await Promise.all([
      db.campaignRecipient.count({
        where: {
          orgId,
          status: { not: 'PENDING' },
          sentAt: { gte: firstDay, lte: lastDay },
          campaign: { channel: CampaignChannel.EMAIL }
        }
      }),
      db.campaignRecipient.count({
        where: {
          orgId,
          status: { not: 'PENDING' },
          sentAt: { gte: dayStart },
          campaign: { channel: CampaignChannel.EMAIL }
        }
      })
    ])

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true }
    })

    const planSlug = org?.plan?.slug || 'starter'
    const limit = emailMonthlyLimit(planSlug)
    const dailyLimit = emailDailyLimit(planSlug)

    if (limit === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign sending is not available on your current plan. Please upgrade.'
        },
        { status: 402 }
      )
    }

    emailRemaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity
    emailDailyRemaining = Math.max(0, dailyLimit - usedToday)
  }

  // STEP 3 — WhatsApp addon check
  if (campaign.channel === CampaignChannel.WHATSAPP) {
    const addon = await prisma.organizationModule.findFirst({
      where: {
        orgId,
        module: { slug: 'whatsapp_addon' },
        enabled: true
      }
    })
    if (!addon) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp addon is required to send WhatsApp campaigns. Please upgrade.'
        },
        { status: 403 }
      )
    }
  }

  // STEP 4 — Build recipient list
  const audienceFilter = campaign.audienceFilter as any
  const pool = audienceFilter?.pool || 'BOTH'
  const filters = audienceFilter?.filters || []

  const recipients: Array<{
    recipientType: string
    recipientId: string
    name: string
    phone: string | null
    email: string | null
  }> = []

  if (pool === 'LEADS' || pool === 'BOTH') {
    const leadWhere: Prisma.LeadWhereInput = {
      orgId,
      deletedAt: null
    }

    const createdAtFilter: Prisma.DateTimeFilter = {}
    filters.forEach((f: any) => {
      if (!f.value) return
      if (f.field === 'status') {
        leadWhere.status = asEnum(LeadStatus, f.value, 'status')
      } else if (f.field === 'gradeSought') {
        leadWhere.gradeSought = f.value
      } else if (f.field === 'source') {
        leadWhere.source = asEnum(LeadSource, f.value, 'source')
      } else if (f.field === 'assignedToId') {
        leadWhere.assignedToId = f.value
      } else if (f.field === 'dateFrom') {
        createdAtFilter.gte = new Date(f.value)
      } else if (f.field === 'dateTo') {
        createdAtFilter.lte = new Date(f.value)
      }
    })
    if (createdAtFilter.gte || createdAtFilter.lte) {
      leadWhere.createdAt = createdAtFilter
    }

    const leads = await db.lead.findMany({ where: leadWhere })
    leads.forEach((lead) => {
      recipients.push({
        recipientType: 'LEAD',
        recipientId: lead.id,
        name: lead.parentName,
        phone: lead.phone ?? null,
        email: lead.email ?? null
      })
    })
  }

  if (pool === 'STUDENTS' || pool === 'BOTH') {
    const studentWhere: Prisma.StudentWhereInput = {
      orgId,
      deletedAt: null,
      status: StudentStatus.ACTIVE
    }

    filters.forEach((f: any) => {
      if (!f.value) return
      if (f.field === 'gradeLabel') {
        studentWhere.gradeLabel = f.value
      } else if (f.field === 'status') {
        studentWhere.status = asEnum(StudentStatus, f.value, 'status')
      } else if (f.field === 'academicYearId') {
        studentWhere.academicYearId = f.value
      } else if (f.field === 'courseId') {
        studentWhere.courseEnrollments = {
          some: {
            courseId: f.value,
            status: EnrollmentStatus.ACTIVE
          }
        }
      }
    })

    const students = await db.student.findMany({ where: studentWhere })
    students.forEach((student) => {
      recipients.push({
        recipientType: 'STUDENT_GUARDIAN',
        recipientId: student.id,
        name: student.guardianName ?? student.name,
        phone: student.guardianPhone ?? null,
        email: student.guardianEmail ?? null
      })
    })
  }

  // STEP 5 — Quota limit enforcement
  if (!isCreditChannel) {
    // EMAIL monthly plan quota (real ceiling).
    if (recipients.length > emailRemaining) {
      return NextResponse.json(
        {
          success: false,
          error: `This campaign would reach ${recipients.length} recipients but you only have ${emailRemaining} remaining this month.`
        },
        { status: 402 }
      )
    }
    // EMAIL daily anti-spike cap (protects the shared sending domain).
    if (recipients.length > emailDailyRemaining) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily email limit reached: this campaign would send ${recipients.length} but only ${emailDailyRemaining} more can go out today. Try again tomorrow or split the send.`
        },
        { status: 429 }
      )
    }
  } else {
    // SMS/WhatsApp flat daily safety cap (wallet is the real limit; this only
    // guards against fat-finger blasts + DLT/Meta abuse flags).
    const dayStart = startOfDayIST(new Date())
    const usedToday = await db.campaignRecipient.count({
      where: {
        orgId,
        status: { not: 'PENDING' },
        sentAt: { gte: dayStart },
        campaign: { channel: creditChannel === 'WHATSAPP' ? CampaignChannel.WHATSAPP : CampaignChannel.SMS }
      }
    })
    const dailyRemaining = Math.max(0, ADDON_DAILY_CAP - usedToday)
    if (recipients.length > dailyRemaining) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily ${creditChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} send limit reached (${ADDON_DAILY_CAP}/day): ${dailyRemaining} more can go out today. Try again tomorrow or split the send.`
        },
        { status: 429 }
      )
    }
  }

  // STEP 6 — Handle scheduled campaigns
  if (reqBody?.scheduledAt) {
    const parsedScheduledAt = new Date(reqBody.scheduledAt)
    if (parsedScheduledAt > new Date()) {
      await db.campaign.update({
        where: { id: campaign.id },
        data: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: parsedScheduledAt
        }
      })
      return NextResponse.json({
        success: true,
        data: {
          scheduled: true,
          scheduledAt: parsedScheduledAt.toISOString(),
          recipientCount: recipients.length
        }
      })
    }
  }

  // STEP 6.5 — Credit metering for SMS/WhatsApp. Verified BYO provider →
  // sends go through the org's own account, no debit. Otherwise pre-debit
  // the whole batch (failed sends refunded in STEP 10); zero balance blocks.
  let providerCreds: Awaited<ReturnType<typeof getActiveProviderConfig>> = null
  let debitSplit: { fromFree: number; fromPurchased: number } | null = null
  let debitIntentId: string | null = null
  let creditsPerMessage = 1

  if (isCreditChannel && recipients.length > 0) {
    providerCreds = await getActiveProviderConfig(orgId, creditChannel)

    // WhatsApp template ↔ account scope guard: a template only exists on
    // one WABA, so sending a Vidhyaan-catalog template through the org's
    // own account (or vice versa) would always fail at MSG91.
    if (campaign.channel === CampaignChannel.WHATSAPP && campaign.whatsappTemplateId) {
      const tpl = await db.whatsappTemplate.findFirst({
        where: { id: campaign.whatsappTemplateId, orgId, deletedAt: null },
        select: { accountScope: true, name: true, metaCategory: true }
      })
      if (!tpl) {
        return NextResponse.json(
          { success: false, error: 'The WhatsApp template selected for this campaign no longer exists.' },
          { status: 422 }
        )
      }
      if (providerCreds && tpl.accountScope !== 'OWN') {
        return NextResponse.json(
          { success: false, error: `Template "${tpl.name}" belongs to the Vidhyaan account, but this campaign would send through your own WhatsApp account. Pick one of your own templates.` },
          { status: 422 }
        )
      }
      if (!providerCreds && tpl.accountScope === 'OWN') {
        return NextResponse.json(
          { success: false, error: `Template "${tpl.name}" belongs to your own WhatsApp account, which is not verified/active. Re-verify it in Settings → Add-ons or pick a Vidhyaan template.` },
          { status: 422 }
        )
      }
      // Marketing-category templates cost Meta ~7.5× a utility message —
      // reflected as 2 credits per recipient (utility/auth stay at 1).
      if (tpl.metaCategory === 'MARKETING') {
        creditsPerMessage = 2
      }
    }

    if (!providerCreds) {
      const creditsNeeded = recipients.length * creditsPerMessage
      try {
        const spent = await spendCreditsWithIntent(orgId, creditChannel, creditsNeeded, campaign.id)
        debitSplit = { fromFree: spent.fromFree, fromPurchased: spent.fromPurchased }
        debitIntentId = spent.intentId
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return NextResponse.json(
            {
              success: false,
              error: `Not enough ${creditChannel === 'SMS' ? 'SMS' : 'WhatsApp'} credits: this campaign needs ${creditsNeeded}${creditsPerMessage > 1 ? ` (${recipients.length} recipients × ${creditsPerMessage} credits for a marketing template)` : ''}, you have ${err.available}. Purchase credits in Settings → Add-ons.`,
              code: 'INSUFFICIENT_CREDITS',
              shortfall: err.shortfall,
              available: err.available
            },
            { status: 402 }
          )
        }
        throw err
      }
    }
  }

  // STEP 7 — Create recipient records
  await db.campaignRecipient.createMany({
    data: recipients.map(r => ({
      orgId,
      campaignId: campaign.id,
      recipientType: r.recipientType,
      recipientId: r.recipientId,
      name: r.name,
      phone: r.phone,
      email: r.email,
      status: 'PENDING' as const
    })),
    skipDuplicates: true
  })

  const recipientRecords = await db.campaignRecipient.findMany({
    where: { campaignId: campaign.id, orgId }
  })

  // STEP 7.5 — Resolve an attached digital form. EMAIL/SMS inject the link via
  // {{link}} in the body; WhatsApp needs a template whose variable mapping
  // includes the `link` token. Skip minting if the message can't carry a link
  // (avoids orphan instances + a "sent" funnel count with no link delivered).
  let attachedFormId: string | null = null
  if (campaign.formTemplateId) {
    const bodyHasLink =
      campaign.channel === CampaignChannel.WHATSAPP
        ? true // resolved per-template in sendCampaignMessage
        : (campaign.templateBody ?? '').includes('{{link}}')
    if (bodyHasLink) {
      const form = await db.form.findFirst({
        where: { id: campaign.formTemplateId, orgId, status: 'PUBLISHED' },
        select: { id: true }
      })
      attachedFormId = form?.id ?? null
    }
  }

  // STEP 8 — Update campaign status to SENDING
  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.SENDING }
  })

  // BYO verified sending domain (Enterprise) — EMAIL From override, resolved
  // once per campaign. undefined = fall back to shared send.vidhyaan.com.
  const senderFrom =
    campaign.channel === CampaignChannel.EMAIL
      ? await resolveOrgCampaignFrom(orgId)
      : undefined

  // STEP 9 — Send messages (Process in batches of 50)
  const batchSize = 50
  for (let i = 0; i < recipientRecords.length; i += batchSize) {
    const batch = recipientRecords.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (record) => {
        try {
          // Per-recipient form link (unique token feeding the campaign funnel).
          let formLink: string | null = null
          if (attachedFormId) {
            try {
              formLink = await mintCampaignInstance(db, {
                orgId,
                formId: attachedFormId,
                campaignId: campaign.id,
                channel:
                  campaign.channel === CampaignChannel.EMAIL ? 'EMAIL'
                  : campaign.channel === CampaignChannel.WHATSAPP ? 'WHATSAPP'
                  : 'SMS',
                recipientType: record.recipientType,
                recipientId: record.recipientId,
                email: record.email,
                phone: record.phone
              })
            } catch (err) {
              console.error('Form instance mint failed:', err)
            }
          }

          const result = await sendCampaignMessage(
            {
              id: campaign.id,
              name: campaign.name,
              channel: campaign.channel,
              templateBody: campaign.templateBody,
              heroImageUrl: campaign.heroImageUrl ?? null,
              whatsappTemplateId: campaign.whatsappTemplateId ?? null,
              paramValues: (campaign.paramValues as Record<string, string> | null) ?? null,
              organization: {
                name: campaign.organization.name
              }
            },
            {
              name: record.name || '',
              phone: record.phone,
              email: record.email,
              formLink
            },
            providerCreds ?? undefined,
            senderFrom
          )

          if (result.success) {
            await db.campaignRecipient.update({
              where: { id: record.id },
              data: {
                status: 'SENT' as const,
                sentAt: new Date(),
                // wamid (WhatsApp) or SES messageId (email) — the join key for
                // the delivery/bounce/complaint webhooks.
                providerMessageId: result.wamid ?? result.messageId ?? null
              }
            })
            // Outbound log — delivery webhook joins back via wamid
            if (result.wamid && record.phone) {
              await prisma.whatsappMessage
                .create({
                  data: {
                    orgId,
                    wamid: result.wamid,
                    phone: record.phone.replace(/\D/g, '').slice(-10),
                    templateName: campaign.whatsappTemplateId ?? 'campaign',
                    ref: `campaign_recipient:${record.id}`
                  }
                })
                .catch(() => {})
            }
          } else {
            await db.campaignRecipient.update({
              where: { id: record.id },
              data: {
                status: 'FAILED' as const,
                failureReason: result.error || 'Unknown error'
              }
            })
          }
        } catch (err: any) {
          await db.campaignRecipient.update({
            where: { id: record.id },
            data: {
              status: 'FAILED' as const,
              failureReason: err.message || 'Error occurred during sending'
            }
          })
        }
      })
    )
  }

  // STEP 10 — Finalize campaign
  const finalRecipients = await db.campaignRecipient.findMany({
    where: { campaignId: campaign.id, orgId }
  })

  const finalSent = finalRecipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length
  const finalFailed = finalRecipients.filter(r => r.status === 'FAILED').length
  const finalDelivered = finalRecipients.filter(r => r.status === 'DELIVERED').length

  // Refund credits for failed sends in the pre-debited batch
  if (debitSplit && finalFailed > 0) {
    await refundCredits(orgId, creditChannel, finalFailed * creditsPerMessage, debitSplit, campaign.id).catch(err =>
      console.error('Credit refund failed:', err)
    )
  }

  // Settles the batch-level spend intent now that finalize actually ran —
  // any partial refund above already adjusted the wallet correctly; this
  // just tells the reconcile cron "this batch was accounted for, leave it
  // alone." If the process crashes before reaching this line, the intent
  // stays PENDING and the cron refunds the *full* original debit once its
  // timeout passes — generous (recipients that did succeed effectively get
  // a free re-send next time) rather than losing the credits outright,
  // since a crash mid-batch has no way to know the true per-recipient split.
  if (debitIntentId) {
    await confirmSpendIntent(debitIntentId).catch(err =>
      console.error(`confirmSpendIntent(${debitIntentId}) failed:`, err)
    )
  }

  const updatedCampaign = await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: CampaignStatus.COMPLETED,
      sentAt: new Date(),
      stats: {
        totalRecipients: recipients.length,
        sent: finalSent,
        delivered: finalDelivered,
        failed: finalFailed
      }
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      scheduled: false,
      recipientCount: recipients.length,
      sent: finalSent,
      failed: finalFailed
    }
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params
  const id = resolvedParams?.id
  if (!id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Parse body safely
  let reqBody: any = null
  try {
    reqBody = await request.json()
  } catch (e) {
    // Body is empty or not JSON
  }

  const authHeader = request.headers.get('Authorization')
  const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (isCronCall) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        organization: { select: { name: true } }
      }
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const db = forOrg(campaign.orgId)
    return await handleSendCampaign({
      campaign,
      db,
      orgId: campaign.orgId,
      userId: null,
      reqBody
    })
  } else {
    // Run middleware via route wrapper
    const routeHandler = route({
      module: 'campaign_management',
      roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
      handler: async ({ db, user }) => {
        const campaign = await db.campaign.findFirst({
          where: { id, orgId: user.orgId, deletedAt: null },
          include: {
            organization: { select: { name: true } }
          }
        })
        if (!campaign) {
          throw Errors.notFound('Campaign')
        }

        return await handleSendCampaign({
          campaign,
          db,
          orgId: user.orgId,
          userId: user.id,
          reqBody
        })
      }
    })

    return routeHandler(request, context)
  }
}
