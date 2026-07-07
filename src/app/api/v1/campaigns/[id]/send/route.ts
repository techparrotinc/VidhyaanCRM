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
import { spendCredits, refundCredits, InsufficientCreditsError } from '@/lib/credits/engine'
import { getActiveProviderConfig } from '@/lib/credits/provider'
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
  if (!isCreditChannel) {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const used = await db.campaignRecipient.count({
      where: {
        orgId,
        status: { not: 'PENDING' },
        sentAt: {
          gte: firstDay,
          lte: lastDay
        }
      }
    })

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true }
    })

    const planSlug = org?.plan?.slug || 'starter'

    let limit = 500
    const planSlugLower = planSlug.toLowerCase()
    if (planSlugLower === 'free') {
      limit = 0
    } else if (planSlugLower === 'starter') {
      limit = 500
    } else if (planSlugLower === 'growth') {
      limit = 5000
    }

    if (limit === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign sending is not available on your current plan. Please upgrade.'
        },
        { status: 402 }
      )
    }

    emailRemaining = Math.max(0, limit - used)
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

  // STEP 5 — Quota limit enforcement (EMAIL plan quota only)
  if (!isCreditChannel && recipients.length > emailRemaining) {
    return NextResponse.json(
      {
        success: false,
        error: `This campaign would reach ${recipients.length} recipients but you only have ${emailRemaining} remaining this month.`
      },
      { status: 402 }
    )
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

  if (isCreditChannel && recipients.length > 0) {
    providerCreds = await getActiveProviderConfig(orgId, creditChannel)
    if (!providerCreds) {
      try {
        debitSplit = await spendCredits(orgId, creditChannel, recipients.length, campaign.id)
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return NextResponse.json(
            {
              success: false,
              error: `Not enough ${creditChannel === 'SMS' ? 'SMS' : 'WhatsApp'} credits: this campaign needs ${recipients.length}, you have ${err.available}. Purchase credits in Settings → Add-ons.`,
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

  // STEP 8 — Update campaign status to SENDING
  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.SENDING }
  })

  // STEP 9 — Send messages (Process in batches of 50)
  const batchSize = 50
  for (let i = 0; i < recipientRecords.length; i += batchSize) {
    const batch = recipientRecords.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (record) => {
        try {
          const result = await sendCampaignMessage(
            {
              id: campaign.id,
              name: campaign.name,
              channel: campaign.channel,
              templateBody: campaign.templateBody,
              organization: {
                name: campaign.organization.name
              }
            },
            {
              name: record.name || '',
              phone: record.phone,
              email: record.email
            },
            providerCreds ?? undefined
          )

          if (result.success) {
            await db.campaignRecipient.update({
              where: { id: record.id },
              data: {
                status: 'SENT' as const,
                sentAt: new Date()
              }
            })
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
    await refundCredits(orgId, creditChannel, finalFailed, debitSplit, campaign.id).catch(err =>
      console.error('Credit refund failed:', err)
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
