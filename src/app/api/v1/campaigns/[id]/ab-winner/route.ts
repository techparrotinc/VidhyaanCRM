import { z } from 'zod'
import { CampaignChannel, CampaignStatus } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { sendCampaignMessage } from '@/lib/campaign/sendCampaignMessage'
import { resolveOrgCampaignFrom } from '@/lib/campaign/sendingDomain'

const schema = z.object({
  // Explicit winner, else auto-pick by open rate among the test recipients.
  winnerKey: z.string().max(4).optional().nullable(),
}).optional()

type Variant = { key: string; templateBody: string; heroImageUrl?: string | null }

// Send the winning A/B variant to the held-back remainder of the audience.
export const POST = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) throw Errors.notFound('Campaign')

    const body = schema.parse(await req.json().catch(() => ({}))) ?? {}

    const campaign = await db.campaign.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: { organization: { select: { name: true } } },
    })
    if (!campaign) throw Errors.notFound('Campaign')

    const variants = (campaign.abVariants as Variant[] | null) ?? null
    if (campaign.channel !== CampaignChannel.EMAIL || !Array.isArray(variants) || variants.length < 2) {
      throw Errors.businessRule('This campaign is not an A/B test.')
    }
    if (campaign.abWinnerSentAt) {
      throw Errors.businessRule('A winner has already been sent for this campaign.')
    }

    // Test recipients (variant assigned + already processed).
    const tested = await db.campaignRecipient.findMany({
      where: { campaignId: id, orgId: user.orgId, variantKey: { not: null } },
      select: { variantKey: true, status: true, openedAt: true, clickedAt: true },
    })
    if (tested.length === 0) throw Errors.businessRule('Run the A/B test send first.')

    // Pick the winner: explicit, else highest open rate (tie-break clicks).
    let winnerKey = body?.winnerKey ?? null
    if (!winnerKey || !variants.some(v => v.key === winnerKey)) {
      let best = variants[0].key
      let bestScore = -1
      for (const v of variants) {
        const rs = tested.filter(r => r.variantKey === v.key)
        const delivered = rs.filter(r => r.status === 'DELIVERED' || r.status === 'READ').length || rs.length
        const opened = rs.filter(r => r.openedAt).length
        const clicked = rs.filter(r => r.clickedAt).length
        const score = delivered > 0 ? opened / delivered + (clicked / delivered) * 0.01 : 0
        if (score > bestScore) { bestScore = score; best = v.key }
      }
      winnerKey = best
    }
    const winner = variants.find(v => v.key === winnerKey)!

    // Remaining held recipients (never sent).
    const held = await db.campaignRecipient.findMany({
      where: { campaignId: id, orgId: user.orgId, status: 'PENDING', variantKey: null },
    })

    const senderFrom = await resolveOrgCampaignFrom(user.orgId)

    let sent = 0
    let failed = 0
    const batchSize = 50
    for (let i = 0; i < held.length; i += batchSize) {
      const batch = held.slice(i, i + batchSize)
      await Promise.allSettled(batch.map(async (record) => {
        try {
          const res = await sendCampaignMessage(
            {
              id: campaign.id,
              name: campaign.name,
              channel: campaign.channel,
              templateBody: winner.templateBody,
              heroImageUrl: winner.heroImageUrl ?? null,
              paramValues: (campaign.paramValues as Record<string, string> | null) ?? null,
              organization: { name: campaign.organization.name },
            },
            { name: record.name || '', phone: record.phone, email: record.email },
            undefined,
            senderFrom
          )
          if (res.success) {
            sent++
            await db.campaignRecipient.update({
              where: { id: record.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
                variantKey: winnerKey,
                providerMessageId: res.messageId ?? null,
              },
            })
          } else {
            failed++
            await db.campaignRecipient.update({
              where: { id: record.id },
              data: { status: 'FAILED', failureReason: res.error || 'Send failed', variantKey: winnerKey },
            })
          }
        } catch (err: any) {
          failed++
          await db.campaignRecipient.update({
            where: { id: record.id },
            data: { status: 'FAILED', failureReason: err.message || 'Send failed', variantKey: winnerKey },
          }).catch(() => {})
        }
      }))
    }

    await db.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.COMPLETED,
        abWinnerKey: winnerKey,
        abWinnerSentAt: new Date(),
      },
    })

    return ok({ winnerKey, sentToRemainder: sent, failed })
  },
})
