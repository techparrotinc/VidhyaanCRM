import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/**
 * Per-organization revenue metrics for the admin console:
 * lifetime revenue, MRR, subscription vs add-on split, wallet balances,
 * monthly revenue trend (12 months), recent transactions.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null },
      select: { id: true }
    })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const [successTx, activeSubscriptions, wallets, recentTx, studentCount] = await Promise.all([
      prisma.transaction.findMany({
        where: { orgId: id, status: 'SUCCESS' },
        select: { amount: true, subscriptionId: true, metadata: true, paidAt: true, createdAt: true }
      }),
      prisma.subscription.findMany({
        where: { orgId: id, status: 'ACTIVE', deletedAt: null },
        include: { plan: { select: { name: true, slug: true } } }
      }),
      prisma.messageWallet.findMany({
        where: { orgId: id },
        select: { channel: true, freeAllowance: true, freeUsed: true, purchasedBalance: true }
      }),
      prisma.transaction.findMany({
        where: { orgId: id },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { subscription: { include: { plan: { select: { name: true } } } } }
      }),
      prisma.student.count({ where: { orgId: id, deletedAt: null } })
    ])

    let lifetimeRevenue = 0
    let subscriptionRevenue = 0
    const addonRevenue: Record<string, number> = { SMS: 0, WHATSAPP: 0, AI: 0, OTHER: 0 }
    const monthly: Record<string, number> = {}

    for (const tx of successTx) {
      const amount = Number(tx.amount)
      lifetimeRevenue += amount
      if (tx.subscriptionId) {
        subscriptionRevenue += amount
      } else {
        const channel = (tx.metadata as any)?.channel as string | undefined
        if (channel && channel in addonRevenue) addonRevenue[channel] += amount
        else addonRevenue.OTHER += amount
      }
      const when = tx.paidAt ?? tx.createdAt
      if (when >= twelveMonthsAgo) {
        const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`
        monthly[key] = (monthly[key] || 0) + amount
      }
    }

    // Normalize active subscription amounts to MRR
    let mrr = 0
    for (const sub of activeSubscriptions) {
      const amount = Number(sub.amount)
      if (sub.billingCycle === 'QUARTERLY') mrr += amount / 3
      else if (sub.billingCycle === 'ANNUAL') mrr += amount / 12
      else mrr += amount
    }

    // Fill the 12-month trend (oldest → newest), zero-filled
    const trend: { month: string; revenue: number }[] = []
    const cursor = new Date(twelveMonthsAgo)
    for (let i = 0; i < 12; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      trend.push({ month: key, revenue: monthly[key] || 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    return NextResponse.json({
      lifetimeRevenue,
      subscriptionRevenue,
      addonRevenue,
      mrr: Number(mrr.toFixed(2)),
      arr: Number((mrr * 12).toFixed(2)),
      studentCount,
      activeSubscriptions: activeSubscriptions.map((s) => ({
        id: s.id,
        plan: s.plan.name,
        planSlug: s.plan.slug,
        billingCycle: s.billingCycle,
        amount: Number(s.amount),
        discountPct: s.discountPct,
        currentPeriodEnd: s.currentPeriodEnd,
        trialEndsAt: s.trialEndsAt
      })),
      wallets: wallets.map((w) => ({
        channel: w.channel,
        freeRemaining: Math.max(0, w.freeAllowance - w.freeUsed),
        purchasedBalance: w.purchasedBalance
      })),
      trend,
      transactions: recentTx.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        status: t.status,
        type: t.subscriptionId
          ? `Subscription — ${t.subscription?.plan?.name ?? 'plan'}`
          : (t.metadata as any)?.channel
            ? `${(t.metadata as any).channel} credits${(t.metadata as any).credits ? ` × ${(t.metadata as any).credits}` : ''}`
            : 'Other',
        gatewayRef: t.gatewayRef,
        paidAt: t.paidAt,
        createdAt: t.createdAt
      }))
    })
  } catch (error: any) {
    console.error('Org Metrics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
