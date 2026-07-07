import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { ADDONS } from '@/constants/addons'
import { packsForChannel } from '@/lib/credits/constants'
import { getWalletSummary } from '@/lib/credits/engine'

/**
 * GET /api/v1/settings/addons
 * Catalog of add-ons with per-org enablement, wallet summary and BYO
 * provider status. Driven by src/constants/addons.ts — future add-ons
 * appended there show up here automatically.
 */
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    const [orgModules, wallets, providers] = await Promise.all([
      prisma.organizationModule.findMany({
        where: { orgId: user.orgId, module: { slug: { in: ADDONS.map(a => a.slug) } } },
        include: { module: { select: { slug: true } } }
      }),
      getWalletSummary(user.orgId),
      prisma.messagingProviderConfig.findMany({
        where: { orgId: user.orgId, deletedAt: null }
      })
    ])

    const enabledSlugs = new Set(
      orgModules.filter(om => om.enabled).map(om => om.module.slug)
    )
    const walletByChannel = new Map(wallets.map(w => [w.channel, w]))
    const providerByChannel = new Map(providers.map(p => [p.channel, p]))

    const addons = ADDONS.map(addon => {
      const wallet = addon.channel ? walletByChannel.get(addon.channel) : null
      const provider = addon.channel ? providerByChannel.get(addon.channel) : null
      return {
        slug: addon.slug,
        name: addon.name,
        description: addon.description,
        channel: addon.channel,
        selfServe: addon.selfServe,
        enabled: enabledSlugs.has(addon.slug),
        wallet: wallet ?? null,
        provider: provider
          ? {
              configured: true,
              status: provider.status,
              provider: provider.provider,
              authKeyLast4: provider.authKeyLast4,
              senderId: provider.senderId,
              smsFlowId: provider.smsFlowId,
              whatsappNumber: provider.whatsappNumber,
              verifiedAt: provider.verifiedAt
            }
          : { configured: false },
        packs: addon.channel ? packsForChannel(addon.channel) : []
      }
    })

    return ok({ addons })
  }
})
