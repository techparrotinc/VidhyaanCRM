import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { mintAiToken } from '@/lib/ai/token'
import { MODULES } from '@/constants/modules'
import { ORG_ROLES } from '@/constants/roles'
import { getOrCreateWallet } from '@/lib/credits/engine'

// Mints the short-lived (5 min) RS256 JWT the AI Gateway trusts. The route()
// composer already enforces: session auth, revocation, role, org status, and
// the ai_copilot module license — so a valid token IS the subscription check.
// The widget calls this on open and silently re-mints before expiry.
export const GET = route({
  module: MODULES.AI_COPILOT,
  roles: [...ORG_ROLES],
  handler: async ({ user, org, academicYearId }) => {
    const wallet = await getOrCreateWallet(user.orgId, 'AI')
    const creditsRemaining =
      Math.max(0, wallet.freeAllowance - wallet.freeUsed) + wallet.purchasedBalance
    const { token, expiresIn } = await mintAiToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      planId: org.planId,
      entitlements: ['chat'],
      dailyLimit: 50,
      hasCredits: creditsRemaining > 0,
      academicYearId
    })
    return ok({ token, expiresIn, creditsRemaining })
  }
})
