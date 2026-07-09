import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { redis } from '@/lib/redis'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { buildFinanceAttention } from '@/lib/reports/insights'
import { parseQuery, textParam } from '@/lib/api/query'
import {
  monthWindow, OPEN_INVOICE_STATUSES,
  branchIdsFor, branchScope, effectiveBranchIds
} from '@/lib/reports/queries/scope'
import { computeAgeing } from '@/lib/reports/queries/ageing'

// Accountant's morning screen: who pays today, who is slipping.
// Month windows are calendar-based (finance thinks in months, not AY).
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['ORG_ADMIN', 'ACCOUNTANT'],
  handler: async ({ req, user, db }) => {
    const { branch, fresh } = parseQuery(req.url, { branch: textParam, fresh: textParam })
    const branchIds = effectiveBranchIds(await branchIdsFor(user.id, user.role), branch)
    const br = branchScope(branchIds)

    const cacheKey = `rpt:dash:finance:${user.orgId}:${branchIds?.join(',') ?? 'all'}`
    if (!fresh) {
      const cached = await redis.get(cacheKey).catch(() => null)
      if (cached) return ok(JSON.parse(cached))
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthsAgo12 = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [
      billedMTD, collectedMTD, collectedLastMonth,
      ageing,
      lastMonth90,
      methodMix,
      concessionsMTD,
      todaysReceipts,
      rollups
    ] = await Promise.all([
      db.invoice.aggregate({
        where: { ...br, createdAt: monthWindow(0) },
        _sum: { totalAmount: true },
        _count: { _all: true }
      }),
      db.payment.aggregate({
        where: { ...br, status: 'SUCCESS', paidAt: monthWindow(0) },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      db.payment.aggregate({
        where: { ...br, status: 'SUCCESS', paidAt: monthWindow(-1) },
        _sum: { amount: true }
      }),
      // Whole open book (no row cap): paged balance aggregation.
      computeAgeing(
        db,
        { ...br, status: { in: [...OPEN_INVOICE_STATUSES] } },
        startOfToday
      ),
      // Last month's 90+ snapshot (nightly rollup) for the MoM insight.
      db.dailyRollup.findFirst({
        where: {
          metric: 'overdue_90plus_amount',
          date: { gte: monthWindow(-1).gte, lt: monthWindow(-1).lt },
          ...br
        },
        orderBy: { date: 'desc' },
        select: { amount: true }
      }),
      db.payment.groupBy({
        by: ['method'],
        where: { ...br, status: 'SUCCESS', paidAt: monthWindow(0) },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      db.concession.aggregate({
        where: { createdAt: monthWindow(0) },
        _sum: { value: true },
        _count: { _all: true }
      }),
      db.payment.findMany({
        where: { ...br, status: 'SUCCESS', paidAt: { gte: startOfToday } },
        select: {
          id: true, receiptNumber: true, amount: true, method: true,
          paidAt: true,
          student: { select: { name: true, gradeLabel: true } },
          invoice: { select: { invoiceNumber: true } }
        },
        orderBy: { paidAt: 'desc' },
        take: 10
      }),
      db.dailyRollup.findMany({
        where: {
          metric: { in: ['invoiced_amount', 'collected_amount'] },
          date: { gte: monthsAgo12 },
          ...br
        },
        select: { metric: true, date: true, amount: true }
      })
    ])

    const outstanding = ageing.outstanding
    const overdueTotal = ageing.overdue

    // 90+ month-over-month deterioration (needs last month's snapshot; blank
    // until the nightly rollup has accrued ~a month of history).
    const prev90 = lastMonth90?.amount != null ? Number(lastMonth90.amount) : null
    const ninetyPlusGrowthPct =
      prev90 !== null && prev90 > 0
        ? ((ageing.ninetyPlus - prev90) / prev90) * 100
        : null

    const trendMap = new Map<string, { billed: number; collected: number }>()
    for (const r of rollups) {
      const key = r.date.toISOString().slice(0, 7)
      const entry = trendMap.get(key) ?? { billed: 0, collected: 0 }
      if (r.metric === 'invoiced_amount') entry.billed += Number(r.amount ?? 0)
      else entry.collected += Number(r.amount ?? 0)
      trendMap.set(key, entry)
    }
    const trend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    const billed = Number(billedMTD._sum.totalAmount ?? 0)
    const collected = Number(collectedMTD._sum.amount ?? 0)
    const concessionSum = Number(concessionsMTD._sum.value ?? 0)

    const attention = buildFinanceAttention({
      collectionRateMTD: billed > 0 ? collected / billed : null,
      ninetyPlusGrowthPct,
      concessionPctMTD: billed > 0 ? concessionSum / billed : null
    })

    const data = {
      kpis: {
        billedMTD: { value: billed, invoices: billedMTD._count._all },
        collectedMTD: {
          value: collected,
          payments: collectedMTD._count._all,
          prev: Number(collectedLastMonth._sum.amount ?? 0)
        },
        collectionRate: billed > 0 ? collected / billed : null,
        outstanding: { value: outstanding },
        overdue: { value: overdueTotal }
      },
      ageing: ageing.buckets,
      trend,
      methodMix: methodMix
        .map(m => ({
          method: m.method,
          amount: Number(m._sum.amount ?? 0),
          count: m._count._all
        }))
        .sort((a, b) => b.amount - a.amount),
      concessions: {
        amountMTD: concessionSum,
        countMTD: concessionsMTD._count._all
      },
      todaysReceipts,
      attention
    }

    await redis.set(cacheKey, JSON.stringify(data), 'EX', 120).catch(() => {})
    return ok(data)
  }
})
