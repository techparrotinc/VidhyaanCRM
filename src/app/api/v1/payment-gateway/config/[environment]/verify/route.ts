import { z } from 'zod'
import { GatewayEnvironment, AuditAction } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { windowLimiter } from '@/lib/ratelimit'
import { maskConfig, verifyConfigCredentials, writeGatewayAudit } from '@/lib/payments/config'

/**
 * POST /api/v1/payment-gateway/config/:environment/verify
 * Proves the stored credentials against the provider API. Rate-limited so
 * the endpoint can't be used as a key-validity oracle.
 */
export const POST = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const environment = z.enum(GatewayEnvironment).parse(params?.environment?.toUpperCase())

    const rate = await windowLimiter(`gw-verify:${user.orgId}`, 5, 60 * 60)
    if (!rate.success) {
      throw Errors.rateLimited()
    }

    const config = await db.paymentGatewayConfig.findFirst({ where: { environment } })
    if (!config) {
      throw Errors.notFound('Gateway configuration')
    }

    const result = await verifyConfigCredentials(db, config)

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.UPDATE,
      entityId: config.id,
      req,
      after: { event: 'credentials_verify', environment, ok: result.ok }
    })

    if (!result.ok) {
      throw Errors.businessRule(result.error ?? 'Credential verification failed')
    }

    return ok({ config: maskConfig(result.config) })
  }
})
