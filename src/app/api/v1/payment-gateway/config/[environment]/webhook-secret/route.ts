import { z } from 'zod'
import { GatewayEnvironment, AuditAction } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { windowLimiter } from '@/lib/ratelimit'
import { revealWebhookSecret, rotateWebhookSecret, webhookUrlFor, writeGatewayAudit } from '@/lib/payments/config'

const environmentParam = z.enum(GatewayEnvironment)

/**
 * GET /api/v1/payment-gateway/config/:environment/webhook-secret
 * Reveal the current webhook signing secret so the admin can (re-)register
 * the webhook in the provider dashboard without touching credentials.
 * ORG_ADMIN only, rate-limited, audit-logged.
 */
export const GET = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const environment = environmentParam.parse(params?.environment?.toUpperCase())

    const rate = await windowLimiter(`gw-secret-reveal:${user.orgId}`, 10, 60 * 60)
    if (!rate.success) throw Errors.rateLimited()

    const config = await db.paymentGatewayConfig.findFirst({ where: { environment } })
    if (!config) throw Errors.notFound('Gateway configuration')

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.EXPORT,
      entityId: config.id,
      req,
      after: { event: 'webhook_secret_revealed', environment }
    })

    return ok({
      webhookSecret: revealWebhookSecret(config),
      webhookUrl: webhookUrlFor(user.orgId, config.provider)
    })
  }
})

/**
 * POST /api/v1/payment-gateway/config/:environment/webhook-secret
 * Explicitly rotate the webhook secret. Clears webhook verification — the
 * admin must update the provider dashboard with the new value.
 */
export const POST = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const environment = environmentParam.parse(params?.environment?.toUpperCase())

    const config = await db.paymentGatewayConfig.findFirst({ where: { environment } })
    if (!config) throw Errors.notFound('Gateway configuration')

    const result = await rotateWebhookSecret(db, config)

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.UPDATE,
      entityId: config.id,
      req,
      after: { event: 'webhook_secret_rotated', environment }
    })

    return ok({
      webhookSecret: result.webhookSecret,
      webhookUrl: webhookUrlFor(user.orgId, config.provider)
    })
  }
})
