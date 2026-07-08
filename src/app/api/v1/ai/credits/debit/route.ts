import { NextResponse } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ORG_ROLES } from '@/constants/roles'
import {
  spendCredits,
  getOrCreateWallet,
  InsufficientCreditsError
} from '@/lib/credits/engine'

const bodySchema = z.object({
  units: z.number().int().min(1).max(5),
  ref: z.string().max(80).optional() // gateway message id — makes debits traceable
})

/**
 * POST /api/v1/ai/credits/debit — called by the AI Gateway per answered
 * message (via the service-token path, acting as the user). Mirrors
 * metered-send: free monthly allowance first, then purchased credits.
 * 402 CREDITS_EXHAUSTED when the wallet cannot cover the debit.
 */
export const POST = route({
  module: MODULES.AI_COPILOT,
  roles: [...ORG_ROLES],
  handler: async ({ req, user }) => {
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }
    try {
      await spendCredits(user.orgId, 'AI', parsed.data.units, parsed.data.ref)
      const wallet = await getOrCreateWallet(user.orgId, 'AI')
      const remaining =
        Math.max(0, wallet.freeAllowance - wallet.freeUsed) + wallet.purchasedBalance
      return ok({ debited: parsed.data.units, remaining })
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json(
          { success: false, code: 'CREDITS_EXHAUSTED', available: err.available },
          { status: 402 }
        )
      }
      throw err
    }
  }
})
