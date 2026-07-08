import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/** Revenue rollup per organization — lifetime collected, MRR, plan. */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [lifetimeByOrg, orgs] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['orgId'],
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.organization.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          institutionType: true,
          status: true,
          plan: { select: { name: true, slug: true } },
          subscriptions: {
            where: { status: 'ACTIVE', deletedAt: null },
            select: { amount: true, billingCycle: true }
          },
          _count: { select: { students: { where: { deletedAt: null } } } }
        }
      })
    ])

    const lifetimeMap = new Map(lifetimeByOrg.map((r) => [r.orgId, { total: Number(r._sum.amount || 0), count: r._count._all }]))

    const rows = orgs
      .map((org) => {
        const mrr = org.subscriptions.reduce((sum, s) => {
          const amount = Number(s.amount)
          if (s.billingCycle === 'QUARTERLY') return sum + amount / 3
          if (s.billingCycle === 'ANNUAL') return sum + amount / 12
          return sum + amount
        }, 0)
        const lifetime = lifetimeMap.get(org.id)
        return {
          id: org.id,
          name: org.name,
          institutionType: org.institutionType,
          status: org.status,
          plan: org.plan?.name ?? '—',
          planSlug: org.plan?.slug ?? null,
          students: org._count.students,
          mrr: Number(mrr.toFixed(2)),
          lifetimeRevenue: lifetime?.total ?? 0,
          transactionCount: lifetime?.count ?? 0
        }
      })
      .sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue || b.mrr - a.mrr)

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error('Revenue by Org API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
