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

    const deliveryRate = sent > 0
      ? Math.round((delivered / sent) * 100 * 10) / 10
      : 0
    const readRate = delivered > 0
      ? Math.round((read / delivered) * 100 * 10) / 10
      : 0

    let openRate: number | null = null
    let clickRate: number | null = null

    if (campaign.channel === 'EMAIL' && campaign.stats && typeof campaign.stats === 'object') {
      const statsObj = campaign.stats as Record<string, any>
      if (typeof statsObj.openRate === 'number') {
        openRate = statsObj.openRate
      }
      if (typeof statsObj.clickRate === 'number') {
        clickRate = statsObj.clickRate
      }
    }

    return ok({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        sentAt: campaign.sentAt,
        scheduledAt: campaign.scheduledAt,
        createdAt: campaign.createdAt
      },
      stats: {
        totalRecipients,
        sent,
        delivered,
        read,
        failed,
        deliveryRate,
        readRate,
        openRate,
        clickRate
      },
      recipients: recipients.map((r) => ({
        id: r.id,
        recipientType: r.recipientType,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        failureReason: r.failureReason
      }))
    })
  }
})
