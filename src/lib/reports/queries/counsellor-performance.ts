import { prisma } from '@/lib/db/client'
import { median } from '../insights'
import { ayScope, branchScope, OPEN_LEAD_STATUSES } from './scope'
import { ReportQuery, ReportCtx, Filters, rangeFilter } from './types'

function whereFor(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(ctx.branchIds),
    ...(range ? { createdAt: range } : {}),
    assignedToId: { not: null }
  }
}

async function performanceTable(ctx: ReportCtx, filters: Filters) {
  const where = whereFor(ctx, filters)
  const now = new Date()

  const [counsellors, assigned, contacted, converted, bySource, responsePairs, overdue, targets] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          orgId: ctx.orgId,
          status: 'ACTIVE',
          roleAssignments: { some: { role: 'COUNSELLOR', status: 'ACTIVE' } }
        },
        select: { id: true, name: true }
      }),
      ctx.db.lead.groupBy({ by: ['assignedToId'], where, _count: { _all: true } }),
      ctx.db.lead.groupBy({
        by: ['assignedToId'],
        where: { ...where, firstContactedAt: { not: null } },
        _count: { _all: true }
      }),
      ctx.db.admission.groupBy({
        by: ['assignedToId'],
        where: {
          ...ayScope(ctx.academicYearId),
          ...branchScope(ctx.branchIds),
          ...(rangeFilter(filters) ? { createdAt: rangeFilter(filters) } : {}),
          assignedToId: { not: null }
        },
        _count: { _all: true }
      }),
      ctx.db.lead.groupBy({
        by: ['assignedToId', 'source'],
        where,
        _count: { _all: true }
      }),
      ctx.db.lead.findMany({
        where: { ...where, firstContactedAt: { not: null } },
        select: { assignedToId: true, createdAt: true, firstContactedAt: true },
        take: 5000
      }),
      ctx.db.lead.groupBy({
        by: ['assignedToId'],
        where: {
          ...ayScope(ctx.academicYearId),
          ...branchScope(ctx.branchIds),
          assignedToId: { not: null },
          status: { in: [...OPEN_LEAD_STATUSES] },
          nextFollowUpAt: { lt: now }
        },
        _count: { _all: true }
      }),
      ctx.db.counsellorTarget.findMany({
        where: { periodStart: { lte: now }, periodEnd: { gte: now } }
      })
    ])

  const toMap = (rows: { assignedToId: string | null; _count: { _all: number } }[]) =>
    new Map(rows.filter(r => r.assignedToId).map(r => [r.assignedToId!, r._count._all]))
  const assignedMap = toMap(assigned)
  const contactedMap = toMap(contacted)
  const convertedMap = toMap(converted)
  const overdueMap = toMap(overdue)

  const responseByUser = new Map<string, number[]>()
  for (const p of responsePairs) {
    if (!p.assignedToId || !p.firstContactedAt) continue
    const list = responseByUser.get(p.assignedToId) ?? []
    list.push((p.firstContactedAt.getTime() - p.createdAt.getTime()) / 36e5)
    responseByUser.set(p.assignedToId, list)
  }

  const topSourceByUser = new Map<string, string>()
  const sourceCounts = new Map<string, Map<string, number>>()
  for (const r of bySource) {
    if (!r.assignedToId) continue
    const m = sourceCounts.get(r.assignedToId) ?? new Map()
    m.set(r.source as string, r._count._all)
    sourceCounts.set(r.assignedToId, m)
  }
  for (const [userId, m] of sourceCounts) {
    const total = [...m.values()].reduce((a, b) => a + b, 0)
    const [src, cnt] = [...m.entries()].sort((a, b) => b[1] - a[1])[0]
    topSourceByUser.set(userId, `${src.replace(/_/g, ' ')} (${Math.round((cnt / total) * 100)}%)`)
  }

  const targetMap = new Map(targets.map(t => [t.userId, t]))

  return counsellors
    .map(c => {
      const leads = assignedMap.get(c.id) ?? 0
      const conv = convertedMap.get(c.id) ?? 0
      const target = targetMap.get(c.id)
      return {
        counsellorId: c.id,
        counsellor: c.name,
        assigned: leads,
        contactedPct: leads > 0 ? (contactedMap.get(c.id) ?? 0) / leads : 0,
        medianResponseHours: median(responseByUser.get(c.id) ?? []),
        conversions: conv,
        conversionPct: leads > 0 ? conv / leads : 0,
        targetAttainmentPct:
          target && target.conversionTarget > 0 ? conv / target.conversionTarget : null,
        overdueFollowUps: overdueMap.get(c.id) ?? 0,
        // Fairness guard: a counsellor fed walk-ins will out-convert one fed
        // paid ads — surface the mix instead of hiding it.
        topSource: topSourceByUser.get(c.id) ?? '—'
      }
    })
    .sort((a, b) => b.conversions - a.conversions)
}

export const counsellorPerformance: ReportQuery = {
  async summary(ctx, filters) {
    const table = await performanceTable(ctx, filters)
    const active = table.filter(r => r.assigned > 0)
    const totalLeads = active.reduce((s, r) => s + r.assigned, 0)
    const totalConv = active.reduce((s, r) => s + r.conversions, 0)
    const teamMedianResponse = median(
      active.map(r => r.medianResponseHours).filter((v): v is number => v !== null)
    )

    const overloaded = active.filter(r => {
      const med = median(active.map(a => a.assigned))
      return med !== null && med > 0 && r.assigned > 1.5 * med
    })

    return {
      kpis: [
        { key: 'counsellors', label: 'Active Counsellors', value: active.length, format: 'int' },
        { key: 'teamConversion', label: 'Team Conversion', value: totalLeads > 0 ? totalConv / totalLeads : null, format: 'pct' },
        { key: 'teamResponse', label: 'Team Median Response', value: teamMedianResponse !== null ? Math.round(teamMedianResponse * 10) / 10 : null, format: 'hours' },
        { key: 'overdueTotal', label: 'Overdue Follow-ups', value: active.reduce((s, r) => s + r.overdueFollowUps, 0), format: 'int' }
      ],
      insight:
        overloaded.length > 0
          ? `${overloaded.map(o => o.counsellor).join(', ')} carrying 1.5× the median lead load — consider rebalancing.`
          : null,
      charts: {
        scatter: active.map(r => ({
          name: r.counsellor,
          responseHours: r.medianResponseHours,
          conversionPct: r.conversionPct,
          assigned: r.assigned
        }))
      }
    }
  },

  async rows(ctx, filters) {
    const table = await performanceTable(ctx, filters)
    return {
      columns: [
        { key: 'counsellor', label: 'Counsellor' },
        { key: 'assigned', label: 'Leads', format: 'int' },
        { key: 'contactedPct', label: 'Contacted %', format: 'pct' },
        { key: 'medianResponseHours', label: 'Median Response', format: 'hours' },
        { key: 'conversions', label: 'Conversions', format: 'int' },
        { key: 'conversionPct', label: 'Conversion %', format: 'pct' },
        { key: 'targetAttainmentPct', label: 'Target Attainment', format: 'pct' },
        { key: 'overdueFollowUps', label: 'Overdue Follow-ups', format: 'int' },
        { key: 'topSource', label: 'Top Source (mix)' }
      ],
      rows: table.map(({ counsellorId: _id, ...r }) => r),
      nextCursor: null
    }
  }
}
