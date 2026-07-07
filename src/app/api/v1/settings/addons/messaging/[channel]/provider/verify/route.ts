import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { decryptSecret } from '@/lib/payments/vault'
import { sendCampaignSMS, sendCampaignWhatsApp } from '@/lib/campaign/channels'
import { parseChannel } from '@/lib/credits/channel'

/**
 * POST — verifies the org's own MSG91 credentials by performing a real
 * test send to the given phone. Success flips the config to VERIFIED,
 * which makes sends bypass Vidhyaan credit metering.
 */
export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user, params }) => {
    const channel = parseChannel((params as any)?.channel)
    const body = z.object({
      testPhone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required'),
      /** WhatsApp verification needs an approved template name. */
      templateId: z.string().max(100).optional()
    }).parse(await req.json())

    const config = await prisma.messagingProviderConfig.findFirst({
      where: { orgId: user.orgId, channel, deletedAt: null }
    })
    if (!config) {
      throw Errors.notFound('Provider configuration')
    }

    const authKey = decryptSecret(config.authKeyEncrypted)

    try {
      if (channel === 'SMS') {
        await sendCampaignSMS({
          to: body.testPhone,
          body: 'Vidhyaan test message — your SMS account is connected.',
          credentials: {
            authKey,
            senderId: config.senderId ?? undefined,
            flowId: config.smsFlowId ?? undefined
          }
        })
      } else {
        await sendCampaignWhatsApp({
          to: body.testPhone,
          templateId: body.templateId ?? 'otp_template',
          body: 'Vidhyaan test message — your WhatsApp account is connected.',
          credentials: {
            authKey,
            whatsappNumber: config.whatsappNumber ?? undefined
          }
        })
      }
    } catch (err: any) {
      return ok({
        channel,
        verified: false,
        error: err.message || 'Test send failed — check your credentials.'
      })
    }

    const updated = await prisma.messagingProviderConfig.update({
      where: { id: config.id },
      data: { status: 'VERIFIED', verifiedAt: new Date() }
    })

    return ok({ channel, verified: true, verifiedAt: updated.verifiedAt })
  }
})
