import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { getWalletSummary } from '@/lib/credits/engine'
import { getActiveProviderConfig } from '@/lib/credits/provider'
import { emailMonthlyLimit, emailDailyLimit, ADDON_DAILY_CAP, startOfDayIST } from '@/lib/campaign/limits'

export const GET = route({
  handler: async ({ db, user }) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const dayStart = startOfDayIST(now)

    // EMAIL usage — monthly (real ceiling) + today (anti-spike cap).
    const [used, usedToday] = await Promise.all([
      db.campaignRecipient.count({
        where: {
          orgId: user.orgId,
          status: { not: 'PENDING' },
          sentAt: { gte: firstDay, lte: lastDay },
          campaign: { channel: 'EMAIL' }
        }
      }),
      db.campaignRecipient.count({
        where: {
          orgId: user.orgId,
          status: { not: 'PENDING' },
          sentAt: { gte: dayStart },
          campaign: { channel: 'EMAIL' }
        }
      })
    ])

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      include: { plan: true }
    })

    const planSlug = org?.plan?.slug || 'starter'
    const planName = org?.plan?.name || 'Starter'

    const limit = emailMonthlyLimit(planSlug)
    const dailyLimit = emailDailyLimit(planSlug)
    const finiteLimit = Number.isFinite(limit) ? limit : null

    // SMS/WhatsApp are credit-metered (Settings → Add-ons); the plan quota
    // above applies to EMAIL campaigns only.
    const [wallets, smsByo, waByo] = await Promise.all([
      getWalletSummary(user.orgId),
      getActiveProviderConfig(user.orgId, 'SMS'),
      getActiveProviderConfig(user.orgId, 'WHATSAPP')
    ])
    const byChannel = Object.fromEntries(wallets.map(w => [w.channel, w]))

    return ok({
      used,
      // -1 signals "unlimited" (enterprise) to the client rather than Infinity,
      // which does not survive JSON.
      limit: finiteLimit ?? -1,
      remaining: finiteLimit === null ? -1 : Math.max(0, finiteLimit - used),
      dailyLimit,
      usedToday,
      dailyRemaining: Math.max(0, dailyLimit - usedToday),
      plan: planName,
      addonDailyCap: ADDON_DAILY_CAP,
      credits: {
        SMS: { ...byChannel.SMS, unlimited: !!smsByo, byoProvider: !!smsByo },
        WHATSAPP: { ...byChannel.WHATSAPP, unlimited: !!waByo, byoProvider: !!waByo }
      }
    })
  }
})
