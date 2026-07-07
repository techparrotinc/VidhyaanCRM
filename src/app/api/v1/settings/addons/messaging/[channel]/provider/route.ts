import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { encryptSecret, currentKeyVersion } from '@/lib/payments/vault'
import { parseChannel } from '@/lib/credits/channel'

const putSchema = z.object({
  provider: z.literal('MSG91').default('MSG91'),
  authKey: z.string().min(8).max(200),
  senderId: z.string().max(20).optional().nullable(),
  smsFlowId: z.string().max(100).optional().nullable(),
  whatsappNumber: z.string().max(20).optional().nullable()
})

/**
 * PUT — save the org's own MSG91 credentials for a channel. Auth key is
 * vault-encrypted; any change resets status to DRAFT until re-verified.
 */
export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user, params }) => {
    const channel = parseChannel((params as any)?.channel)
    const body = putSchema.parse(await req.json())

    const config = await prisma.messagingProviderConfig.upsert({
      where: { orgId_channel: { orgId: user.orgId, channel } },
      create: {
        orgId: user.orgId,
        channel,
        provider: body.provider,
        authKeyEncrypted: encryptSecret(body.authKey),
        encryptionKeyVer: currentKeyVersion(),
        authKeyLast4: body.authKey.slice(-4),
        senderId: body.senderId ?? null,
        smsFlowId: body.smsFlowId ?? null,
        whatsappNumber: body.whatsappNumber ?? null,
        status: 'DRAFT',
        createdById: user.id
      },
      update: {
        provider: body.provider,
        authKeyEncrypted: encryptSecret(body.authKey),
        encryptionKeyVer: currentKeyVersion(),
        authKeyLast4: body.authKey.slice(-4),
        senderId: body.senderId ?? null,
        smsFlowId: body.smsFlowId ?? null,
        whatsappNumber: body.whatsappNumber ?? null,
        status: 'DRAFT',
        verifiedAt: null,
        deletedAt: null
      }
    })

    return ok({
      channel,
      status: config.status,
      authKeyLast4: config.authKeyLast4
    })
  }
})

/**
 * DELETE — disconnect the org's own account; sends fall back to Vidhyaan
 * credits.
 */
export const DELETE = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user, params }) => {
    const channel = parseChannel((params as any)?.channel)

    await prisma.messagingProviderConfig.updateMany({
      where: { orgId: user.orgId, channel, deletedAt: null },
      data: { deletedAt: new Date(), status: 'DISABLED' }
    })

    return ok({ channel, removed: true })
  }
})
