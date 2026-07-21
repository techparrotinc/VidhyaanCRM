import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'

export const GET = route({
  module: 'campaign_management',
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Campaign')
    }

    const campaign = await db.campaign.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!campaign) {
      throw Errors.notFound('Campaign')
    }

    const recipients = await db.campaignRecipient.findMany({
      where: {
        campaignId: id,
        orgId: user.orgId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalRecipients = recipients.length
    const sent = recipients.filter((r) => r.status !== 'PENDING').length
    // READ implies delivered — count both in the delivery funnel
    const delivered = recipients.filter((r) => r.status === 'DELIVERED' || r.status === 'READ').length
    const read = recipients.filter((r) => r.status === 'READ').length
    const failed = recipients.filter((r) => r.status === 'FAILED').length
    const bounced = recipients.filter((r) => r.status === 'BOUNCED').length
    const complained = recipients.filter((r) => r.status === 'COMPLAINED').length

    const deliveryRate = sent > 0
      ? Math.round((delivered / sent) * 100 * 10) / 10
      : 0
    const readRate = delivered > 0
      ? Math.round((read / delivered) * 100 * 10) / 10
      : 0
    // Bounce/complaint measured against everything actually sent.
    const bounceRate = sent > 0
      ? Math.round((bounced / sent) * 100 * 10) / 10
      : 0
    const complaintRate = sent > 0
      ? Math.round((complained / sent) * 100 * 100) / 100
      : 0

    // Open/click come from SES engagement events (openedAt/clickedAt), measured
    // against delivered mail. EMAIL only.
    let openRate: number | null = null
    let clickRate: number | null = null
    if (campaign.channel === 'EMAIL') {
      const opened = recipients.filter((r) => r.openedAt).length
      const clicked = recipients.filter((r) => r.clickedAt).length
      openRate = delivered > 0 ? Math.round((opened / delivered) * 100 * 10) / 10 : 0
      clickRate = delivered > 0 ? Math.round((clicked / delivered) * 100 * 10) / 10 : 0
    }

    // Per-variant breakdown for A/B campaigns.
    const abVariants = (campaign as any).abVariants as Array<{ key: string; subject?: string }> | null
    let variantStats: Array<Record<string, any>> | null = null
    if (Array.isArray(abVariants) && abVariants.length > 0) {
      variantStats = abVariants.map((v) => {
        const rs = recipients.filter((r) => r.variantKey === v.key)
        const vSent = rs.filter((r) => r.status !== 'PENDING').length
        const vDelivered = rs.filter((r) => r.status === 'DELIVERED' || r.status === 'READ').length
        const vOpened = rs.filter((r) => r.openedAt).length
        const vClicked = rs.filter((r) => r.clickedAt).length
        return {
          key: v.key,
          subject: v.subject ?? null,
          sent: vSent,
          delivered: vDelivered,
          opened: vOpened,
          clicked: vClicked,
          openRate: vDelivered > 0 ? Math.round((vOpened / vDelivered) * 1000) / 10 : 0,
          clickRate: vDelivered > 0 ? Math.round((vClicked / vDelivered) * 1000) / 10 : 0,
        }
      })
    }

    return ok({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        sentAt: campaign.sentAt,
        scheduledAt: campaign.scheduledAt,
        createdAt: campaign.createdAt,
        abWinnerKey: (campaign as any).abWinnerKey ?? null,
        abWinnerSentAt: (campaign as any).abWinnerSentAt ?? null
      },
      stats: {
        totalRecipients,
        sent,
        delivered,
        read,
        failed,
        bounced,
        complained,
        deliveryRate,
        readRate,
        bounceRate,
        complaintRate,
        openRate,
        clickRate
      },
      variantStats,
      recipients: recipients.map((r) => ({
        id: r.id,
        recipientType: r.recipientType,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        variantKey: r.variantKey,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        openedAt: r.openedAt,
        clickedAt: r.clickedAt,
        failureReason: r.failureReason
      }))
    })
  }
})
