import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { signAiServiceToken } from '@/lib/ai/service-token'

const PLATFORM_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
const GATEWAY = process.env.NEXT_PUBLIC_AI_GATEWAY_URL ?? 'https://ai.vidhyaan.com'

/**
 * GET /api/admin/ai-usage — platform view of AI adoption & economics.
 * Combines gateway aggregates (messages/tokens/LLM cost/feedback/gaps) with
 * ERP-side credit-wallet data (used/purchased/balance) and org names.
 */
export async function GET() {
  try {
    const session = await auth()
    const role = session?.user?.role ?? ''
    if (!session?.user || !PLATFORM_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. gateway aggregates
    let gatewayOrgs: Record<string, any> = {}
    try {
      const res = await fetch(`${GATEWAY}/v1/ai/admin/usage`, {
        headers: {
          'x-ai-service-token': signAiServiceToken(session.user.id, 'platform', role)
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000)
      })
      if (res.ok) gatewayOrgs = (await res.json()).orgs ?? {}
    } catch (err) {
      console.error('gateway usage fetch failed', err)
    }

    // 2. ERP-side: AI wallets + ledger sums + org names
    const orgIds = Object.keys(gatewayOrgs)
    const [wallets, ledger, orgs] = await Promise.all([
      prisma.messageWallet.findMany({ where: { channel: 'AI' } }),
      prisma.messageCreditLedger.groupBy({
        by: ['orgId', 'reason'],
        where: { channel: 'AI' },
        _sum: { delta: true }
      }),
      prisma.organization.findMany({
        where: orgIds.length ? { id: { in: orgIds } } : undefined,
        select: { id: true, name: true }
      })
    ])

    const nameById = new Map(orgs.map(o => [o.id, o.name]))
    const walletByOrg = new Map(wallets.map(w => [w.orgId, w]))
    const ledgerByOrg = new Map<string, { used: number; purchased: number }>()
    for (const row of ledger) {
      const entry = ledgerByOrg.get(row.orgId) ?? { used: 0, purchased: 0 }
      const delta = row._sum.delta ?? 0
      if (row.reason === 'SEND') entry.used += Math.abs(delta)
      if (row.reason === 'PURCHASE') entry.purchased += delta
      ledgerByOrg.set(row.orgId, entry)
    }

    const rows = Object.entries(gatewayOrgs).map(([orgId, g]) => {
      const wallet = walletByOrg.get(orgId)
      const led = ledgerByOrg.get(orgId) ?? { used: 0, purchased: 0 }
      return {
        orgId,
        orgName: nameById.get(orgId) ?? orgId,
        ...g,
        creditsUsed: led.used,
        creditsPurchased: led.purchased,
        creditsBalance: wallet
          ? Math.max(0, wallet.freeAllowance - wallet.freeUsed) + wallet.purchasedBalance
          : null
      }
    })
    rows.sort((a, b) => b.messages - a.messages)

    return NextResponse.json({ rows })
  } catch (err) {
    console.error('ai-usage admin route', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
