import { branchScope } from './scope'
import { ReportQuery, ReportCtx, Filters, rangeFilter, listFilter } from './types'

// Trend rows come from reporting.daily_rollups (fast, edit-proof history);
// headline KPIs run live so invoiceType/grade filters apply to them.

function invoiceWhere(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const grades = listFilter(filters.grade)
  return {
    ...branchScope(ctx.branchIds),
    ...(range ? { createdAt: range } : {}),
    ...(filters.invoiceType ? { invoiceType: filters.invoiceType as never } : {}),
    ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
  }
}

async function monthlyRows(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const from = range?.gte ?? new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
  const to = range?.lt ?? new Date()

  const rollups = await ctx.db.dailyRollup.findMany({
    where: {
      metric: { in: ['invoiced_amount', 'collected_amount', 'concession_amount'] },
      date: { gte: from, lt: to },
      ...branchScope(ctx.branchIds)
    },
    select: { metric: true, date: true, amount: true }
  })

  const byMonth = new Map<string, { billed: number; collected: number; concessions: number }>()
  for (const r of rollups) {
    const key = r.date.toISOString().slice(0, 7)
    const e = byMonth.get(key) ?? { billed: 0, collected: 0, concessions: 0 }
    if (r.metric === 'invoiced_amount') e.billed += Number(r.amount ?? 0)
    else if (r.metric === 'collected_amount') e.collected += Number(r.amount ?? 0)
    else e.concessions += Number(r.amount ?? 0)
    byMonth.set(key, e)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      billed: v.billed,
      collected: v.collected,
      collectionRate: v.billed > 0 ? v.collected / v.billed : null,
      concessions: v.concessions
    }))
}

export const feeCollectionSummary: ReportQuery = {
  async summary(ctx, filters) {
    const range = rangeFilter(filters)
    const paymentRange = range ?? {
      gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
    }

    const [billed, collected, concessions, monthly] = await Promise.all([
      ctx.db.invoice.aggregate({
        where: invoiceWhere(ctx, filters),
        _sum: { totalAmount: true },
        _count: { _all: true }
      }),
      ctx.db.payment.aggregate({
        where: {
          ...branchScope(ctx.branchIds),
          status: 'SUCCESS',
          paidAt: paymentRange
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      ctx.db.concession.aggregate({
        where: { ...(range ? { createdAt: range } : {}) },
        _sum: { value: true },
        _count: { _all: true }
      }),
      monthlyRows(ctx, filters)
    ])

    const billedSum = Number(billed._sum.totalAmount ?? 0)
    const collectedSum = Number(collected._sum.amount ?? 0)
    const rate = billedSum > 0 ? collectedSum / billedSum : null

    let insight: string | null = null
    if (monthly.length >= 2) {
      const last = monthly[monthly.length - 1]
      const prev = monthly[monthly.length - 2]
      if (last.collectionRate !== null && prev.collectionRate !== null) {
        const diff = (last.collectionRate - prev.collectionRate) * 100
        insight =
          Math.abs(diff) < 2
            ? `Collection rate is steady around ${Math.round(last.collectionRate * 100)}%.`
            : `Collection rate ${diff > 0 ? 'improved' : 'slipped'} ${Math.abs(diff).toFixed(0)} points vs the previous month.`
      }
    }

    return {
      kpis: [
        { key: 'billed', label: 'Billed', value: billedSum, format: 'inr', caption: `${billed._count._all} invoices` },
        { key: 'collected', label: 'Collected', value: collectedSum, format: 'inr', caption: `${collected._count._all} payments` },
        { key: 'rate', label: 'Collection Rate', value: rate, format: 'pct' },
        { key: 'concessions', label: 'Concessions', value: Number(concessions._sum.value ?? 0), format: 'inr', caption: `${concessions._count._all} granted` }
      ],
      insight,
      charts: { feeTrend: monthly.map(m => ({ month: m.month, billed: m.billed, collected: m.collected })) }
    }
  },

  async rows(ctx, filters) {
    const monthly = await monthlyRows(ctx, filters)
    return {
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'billed', label: 'Billed', format: 'inr' },
        { key: 'collected', label: 'Collected', format: 'inr' },
        { key: 'collectionRate', label: 'Rate', format: 'pct' },
        { key: 'concessions', label: 'Concessions', format: 'inr' }
      ],
      rows: monthly,
      nextCursor: null
    }
  }
}
