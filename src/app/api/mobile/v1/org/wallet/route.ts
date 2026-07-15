import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'

/**
 * Thin mobile BFF for the credits wallet balance (mobile-app-plan §3.2 —
 * view only, purchase stays web). The existing `/api/v1/billing` route
 * returns the full org billing page (subscription, transactions, proration,
 * bill-to address...) via a cookie-only `auth()` call — reusing it here
 * would mean patching a heavy unrelated endpoint for one small mobile card,
 * so this pulls just the wallet rows directly instead.
 */
export async function GET(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims || !claims.orgId) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }
  if (claims.role !== 'ORG_ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 })
  }

  const wallets = await prisma.messageWallet.findMany({
    where: { orgId: claims.orgId },
    select: { channel: true, freeAllowance: true, freeUsed: true, purchasedBalance: true }
  })

  const balances = wallets.map((w) => ({
    channel: w.channel,
    remaining: Math.max(0, w.freeAllowance - w.freeUsed) + w.purchasedBalance,
    lowBalance: Math.max(0, w.freeAllowance - w.freeUsed) + w.purchasedBalance < 50
  }))

  return NextResponse.json({ success: true, balances })
}
