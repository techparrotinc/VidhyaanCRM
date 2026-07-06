import { z } from 'zod'
import { GatewayConfigStatus, GatewayEnvironment, AuditAction } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { maskConfig, saveCredentials, webhookUrlFor, writeGatewayAudit } from '@/lib/payments/config'

const environmentParam = z.enum(GatewayEnvironment)

/**
 * PUT /api/v1/payment-gateway/config/:environment
 * Save (or replace) credentials for TEST or LIVE. Resets to DRAFT, rotates
 * the webhook secret and returns it in plaintext — this response is the only
 * time it is ever visible.
 */
export const PUT = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const environment = environmentParam.parse(params?.environment?.toUpperCase())
    const body = z.object({
      keyId: z.string().trim().min(8).max(100),
      keySecret: z.string().trim().min(8).max(200)
    }).parse(await req.json())

    if (environment === GatewayEnvironment.TEST && !body.keyId.startsWith('rzp_test_')) {
      throw Errors.businessRule('Test mode needs a rzp_test_… Key ID')
    }
    if (environment === GatewayEnvironment.LIVE && !body.keyId.startsWith('rzp_live_')) {
      throw Errors.businessRule('Live mode needs a rzp_live_… Key ID')
    }

    const { config, webhookSecret } = await saveCredentials(db, {
      orgId: user.orgId,
      provider: 'RAZORPAY',
      environment,
      keyId: body.keyId,
      keySecret: body.keySecret,
      createdById: user.id
    })

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.UPDATE,
      entityId: config.id,
      req,
      after: { event: 'credentials_saved', environment, keyIdLast4: config.keyIdLast4 }
    })

    return ok({
      config: maskConfig(config),
      webhookSecret, // shown once
      webhookUrl: webhookUrlFor(user.orgId, config.provider)
    })
  }
})

/**
 * DELETE /api/v1/payment-gateway/config/:environment
 * Disable and soft-delete the environment's credentials.
 */
export const DELETE = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const environment = environmentParam.parse(params?.environment?.toUpperCase())
    const config = await db.paymentGatewayConfig.findFirst({ where: { environment } })
    if (!config) {
      throw Errors.notFound('Gateway configuration')
    }

    await db.paymentGatewayConfig.update({
      where: { id: config.id },
      data: { status: GatewayConfigStatus.DISABLED, isCurrent: false, deletedAt: new Date() }
    })

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.DELETE,
      entityId: config.id,
      req,
      after: { event: 'gateway_disabled', environment }
    })

    return ok({ disabled: true })
  }
})
