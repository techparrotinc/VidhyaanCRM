import { z } from 'zod'
import { GatewayConfigStatus, GatewayEnvironment, AuditAction } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { maskConfig, webhookUrlFor, writeGatewayAudit } from '@/lib/payments/config'

/**
 * GET /api/v1/payment-gateway/config
 * Both environment configs, secrets masked, plus the org's webhook URL.
 */
export const GET = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.ACCOUNTANT],
  handler: async ({ db, user }) => {
    const configs = await db.paymentGatewayConfig.findMany({
      orderBy: { environment: 'asc' }
    })
    return ok({
      configs: configs.map(maskConfig),
      webhookUrl: webhookUrlFor(user.orgId, 'RAZORPAY')
    })
  }
})

/**
 * PATCH /api/v1/payment-gateway/config
 * Policy updates and environment activation/toggle. ORG_ADMIN only.
 */
export const PATCH = route({
  module: MODULES.PAYMENT_GATEWAY,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      allowPartial: z.boolean().optional(),
      minPartialAmount: z.number().min(1).nullable().optional(),
      // Setting this activates the environment and routes new checkouts to it
      currentEnvironment: z.enum(GatewayEnvironment).optional()
    }).parse(await req.json())

    if (body.currentEnvironment) {
      const target = await db.paymentGatewayConfig.findFirst({
        where: { environment: body.currentEnvironment }
      })
      if (!target) {
        throw Errors.businessRule(`No ${body.currentEnvironment.toLowerCase()} configuration exists yet`)
      }
      if (target.status === GatewayConfigStatus.SUSPENDED) {
        throw Errors.businessRule('This gateway has been suspended by the platform. Contact support.')
      }
      if (!target.verifiedAt || (target.status !== GatewayConfigStatus.VERIFIED && target.status !== GatewayConfigStatus.ACTIVE)) {
        throw Errors.businessRule(
          `Verify your ${body.currentEnvironment.toLowerCase()} credentials before activating`
        )
      }
      // NOTE(PR4): once the webhook route lands, LIVE activation additionally
      // requires webhookVerifiedAt to be set.

      await db.paymentGatewayConfig.updateMany({
        where: { environment: { not: body.currentEnvironment } },
        data: { isCurrent: false }
      })
      await db.paymentGatewayConfig.update({
        where: { id: target.id },
        data: { isCurrent: true, status: GatewayConfigStatus.ACTIVE }
      })
    }

    const policyData: Record<string, unknown> = {}
    if (body.allowPartial !== undefined) policyData.allowPartial = body.allowPartial
    if (body.minPartialAmount !== undefined) policyData.minPartialAmount = body.minPartialAmount
    if (Object.keys(policyData).length > 0) {
      await db.paymentGatewayConfig.updateMany({ where: {}, data: policyData })
    }

    const configs = await db.paymentGatewayConfig.findMany({ orderBy: { environment: 'asc' } })

    await writeGatewayAudit({
      userId: user.id,
      orgId: user.orgId,
      action: AuditAction.UPDATE,
      entityId: configs.find(c => c.isCurrent)?.id ?? 'policy',
      req,
      after: body as Record<string, unknown>
    })

    return ok({ configs: configs.map(maskConfig) })
  }
})
