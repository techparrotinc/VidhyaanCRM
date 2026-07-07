import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { getWalletSummary } from '@/lib/credits/engine'
import { getActiveProviderConfig } from '@/lib/credits/provider'

export const GET = route({
  handler: async ({ db, user }) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const used = await db.campaignRecipient.count({
      where: {
        orgId: user.orgId,
        status: { not: 'PENDING' },
        sentAt: {
          gte: firstDay,
          lte: lastDay
        }
      }
    })

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      include: {
        plan: true
      }
    })

    const planSlug = org?.plan?.slug || 'starter'
    const planName = org?.plan?.name || 'Starter'

    let limit = 500
    const planSlugLower = planSlug.toLowerCase()
    if (planSlugLower === 'free') {
      limit = 0
    } else if (planSlugLower === 'starter') {
      limit = 500
    } else if (planSlugLower === 'growth') {
      limit = 5000
    }

    // SMS/WhatsApp are credit-metered (Settings → Add-ons); the plan quota
    // above now applies to EMAIL campaigns only.
    const [wallets, smsByo, waByo] = await Promise.all([
      getWalletSummary(user.orgId),
      getActiveProviderConfig(user.orgId, 'SMS'),
      getActiveProviderConfig(user.orgId, 'WHATSAPP')
    ])
    const byChannel = Object.fromEntries(wallets.map(w => [w.channel, w]))

    return ok({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      plan: planName,
      credits: {
        SMS: { ...byChannel.SMS, unlimited: !!smsByo, byoProvider: !!smsByo },
        WHATSAPP: { ...byChannel.WHATSAPP, unlimited: !!waByo, byoProvider: !!waByo }
      }
    })
  }
})
