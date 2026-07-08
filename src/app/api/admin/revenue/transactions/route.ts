import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/** Recent real transactions + payment problems for the revenue dashboard. */
export async function GET() {
  const session = await auth()
  if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [recent, problems] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { paidAt: 'desc' },
      take: 10,
      include: {
        organization: { select: { name: true } },
        subscription: { include: { plan: { select: { name: true } } } }
      }
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { status: 'FAILED' },
          { status: 'REFUNDED' },
          // Stuck pendings older than an hour — likely abandoned or broken
          { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { organization: { select: { name: true } } }
    })
  ])

  const describe = (t: (typeof recent)[number] | (typeof problems)[number]) => {
    const meta = (t.metadata as any) || {}
    if ((t as any).subscription?.plan?.name) return (t as any).subscription.plan.name
    if (meta.planSlug) return `Plan: ${meta.planSlug}`
    if (meta.channel) return `${meta.channel} credits`
    return t.type
  }

  return NextResponse.json({
    recent: recent.map((t) => ({
      id: t.id,
      orgName: t.organization?.name ?? '—',
      description: describe(t),
      amount: Number(t.amount),
      status: t.status,
      date: t.paidAt ?? t.createdAt
    })),
    problems: problems.map((t) => ({
      id: t.id,
      orgName: t.organization?.name ?? '—',
      description: describe(t),
      amount: Number(t.amount),
      status: t.status,
      date: t.createdAt,
      orgId: t.orgId
    }))
  })
}
