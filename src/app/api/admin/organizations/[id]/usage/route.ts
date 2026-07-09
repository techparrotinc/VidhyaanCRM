import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Per-org feature-usage analytics for the admin portal usage dashboard.
// Reads the append-only platform.feature_usage_events log.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const daysParam = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [byFeature, total, last, daily] = await Promise.all([
      prisma.featureUsageEvent.groupBy({
        by: ['feature'],
        where: { orgId: id, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.featureUsageEvent.count({ where: { orgId: id, createdAt: { gte: since } } }),
      prisma.featureUsageEvent.findFirst({
        where: { orgId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, feature: true },
      }),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "created_at") AS day, count(*)::int AS count
        FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
    ])

    const features = byFeature
      .map((f) => ({ feature: f.feature, count: f._count._all }))
      .sort((a, b) => b.count - a.count)

    const series = daily.map((d) => ({
      date: d.day.toISOString().slice(0, 10),
      count: Number(d.count),
    }))

    return NextResponse.json({
      days,
      total,
      activeDays: series.length,
      lastActivityAt: last?.createdAt ?? null,
      lastFeature: last?.feature ?? null,
      features,
      series,
    })
  } catch (error: any) {
    console.error('Org usage API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
