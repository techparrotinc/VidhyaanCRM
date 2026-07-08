import { median } from '../insights'
import {
  ReportQuery, ReportCtx, Filters,
  rangeFilter, listFilter, leadBaseWhere
} from './types'

const STAGE_ORDER = [
  'NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'
]

function whereFor(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const sources = listFilter(filters.source)
  const grades = listFilter(filters.grade)
  return {
    ...leadBaseWhere(ctx),
    ...(range ? { createdAt: range } : {}),
    ...(sources ? { source: { in: sources as never[] } } : {}),
    ...(grades ? { gradeSought: { in: grades } } : {}),
    ...(filters.counsellorId ? { assignedToId: filters.counsellorId } : {}),
    ...(filters.priority ? { priority: filters.priority as never } : {})
  }
}

async function funnelData(ctx: ReportCtx, filters: Filters) {
  const where = whereFor(ctx, filters)
  const [byStatus, contacted, uncontacted48h, conversionPairs] = await Promise.all([
    ctx.db.lead.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ctx.db.lead.count({ where: { ...where, firstContactedAt: { not: null } } }),
    ctx.db.lead.count({
      where: {
        ...where,
        firstContactedAt: null,
        status: { in: ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING'] },
        createdAt: { lt: new Date(Date.now() - 48 * 36e5) }
      }
    }),
    // Conversion cycle time: lead creation → admission creation.
    ctx.db.admission.findMany({
      where: { leadId: { not: null }, createdAt: rangeFilter(filters) ?? {} },
      select: { createdAt: true, lead: { select: { createdAt: true } } },
      take: 1000
    })
  ])

  const count = (s: string) => byStatus.find(r => r.status === s)?._count._all ?? 0
  const total = byStatus.reduce((s, r) => s + r._count._all, 0)
  const converted = count('CONVERTED')
  const medianDays = median(
    conversionPairs
      .filter(p => p.lead)
      .map(p => (p.createdAt.getTime() - p.lead!.createdAt.getTime()) / 864e5)
  )
  return { byStatus, count, total, converted, contacted, uncontacted48h, medianDays }
}

export const leadFunnel: ReportQuery = {
  async summary(ctx, filters) {
    const d = await funnelData(ctx, filters)
    const where = whereFor(ctx, filters)

    // Weekly inflow for the trend strip (bounded fetch, bucketed here).
    const createdDates = await ctx.db.lead.findMany({
      where,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 5000
    })
    const weekly = new Map<string, number>()
    for (const { createdAt } of createdDates) {
      const monday = new Date(createdAt)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      weekly.set(key, (weekly.get(key) ?? 0) + 1)
    }

    // Insight: largest stage-to-stage drop.
    let insight: string | null = null
    const funnelStages = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED'] as const
    let worst: { from: string; to: string; rate: number } | null = null
    for (let i = 1; i < funnelStages.length; i++) {
      // Cumulative reach: a lead now INTERESTED has passed CONTACTED.
      const reached = (s: string) =>
        STAGE_ORDER.slice(STAGE_ORDER.indexOf(s))
          .filter(st => st !== 'NOT_INTERESTED')
          .reduce((sum, st) => sum + d.count(st), 0)
      const prev = reached(funnelStages[i - 1])
      const curr = reached(funnelStages[i])
      if (prev >= 10) {
        const rate = curr / prev
        if (!worst || rate < worst.rate) {
          worst = { from: funnelStages[i - 1], to: funnelStages[i], rate }
        }
      }
    }
    if (worst) {
      insight = `Biggest drop is ${worst.from.toLowerCase()} → ${worst.to.toLowerCase()}: only ${Math.round(worst.rate * 100)}% progress past it.`
    }

    return {
      kpis: [
        { key: 'total', label: 'Total Leads', value: d.total, format: 'int' },
        { key: 'contactedPct', label: 'Contacted', value: d.total > 0 ? d.contacted / d.total : null, format: 'pct' },
        { key: 'convertedPct', label: 'Converted', value: d.total > 0 ? d.converted / d.total : null, format: 'pct' },
        { key: 'medianDays', label: 'Median Days to Convert', value: d.medianDays !== null ? Math.round(d.medianDays * 10) / 10 : null, format: 'int' },
        { key: 'uncontacted48h', label: 'Uncontacted 48h+', value: d.uncontacted48h, format: 'int' }
      ],
      insight,
      charts: {
        funnel: STAGE_ORDER.map(status => ({
          status,
          count: d.count(status),
          prevCount: null
        })),
        weeklyInflow: [...weekly.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, count]) => ({ week, count }))
      }
    }
  },

  async rows(ctx, filters) {
    const d = await funnelData(ctx, filters)
    let prev = d.total
    const rows = STAGE_ORDER.map(status => {
      const c = d.count(status)
      const row = {
        stage: status.replace(/_/g, ' '),
        count: c,
        pctOfTotal: d.total > 0 ? c / d.total : 0,
        pctOfPrevious: prev > 0 ? c / prev : 0
      }
      if (status !== 'NOT_INTERESTED') prev = c > 0 ? c : prev
      return row
    })
    return {
      columns: [
        { key: 'stage', label: 'Stage' },
        { key: 'count', label: 'Leads', format: 'int' },
        { key: 'pctOfTotal', label: '% of Total', format: 'pct' },
        { key: 'pctOfPrevious', label: '% of Previous', format: 'pct' }
      ],
      rows,
      nextCursor: null
    }
  }
}
