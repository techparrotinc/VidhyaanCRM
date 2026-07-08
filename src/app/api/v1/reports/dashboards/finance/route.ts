import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { redis } from '@/lib/redis'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { buildFinanceAttention } from '@/lib/reports/insights'
import { monthWindow, OPEN_INVOICE_STATUSES } from '@/lib/reports/queries/scope'

const AGEING_BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const

function bucketFor(daysOverdue: number): (typeof AGEING_BUCKETS)[number] {
  if (daysOverdue <= 30) return '0-30'
  if (daysOverdue <= 60) return '31-60'
  if (daysOverdue <= 90) return '61-90'
  return '90+'
}

// Accountant's morning screen: who pays today, who is slipping.
// Month windows are calendar-based (finance thinks in months, not AY).
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['ORG_ADMIN', 'ACCOUNTANT'],
  handler: async ({ user, db }) => {
    const cacheKey = `rpt:dash:finance:${user.orgId}`
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) return ok(JSON.parse(cached))

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthsAgo12 = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [
      billedMTD, collectedMTD, collectedLastMonth,
      openInvoices,
      methodMix,
      concessionsMTD,
      todaysReceipts,
      rollups
    ] = await Promise.all([
      db.invoice.aggregate({
        where: { createdAt: monthWindow(0) },
        _sum: { totalAmount: true },
        _count: { _all: true }
      }),
      db.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: monthWindow(0) },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      db.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: monthWindow(-1) },
        _sum: { amount: true }
      }),
      // Ageing needs per-invoice date math — bounded fetch, aggregated here.
      db.invoice.findMany({
        where: { status: { in: [...OPEN_INVOICE_STATUSES] } },
        select: { dueDate: true, totalAmount: true, paidAmount: true },
        take: 5000
      }),
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'SUCCESS', paidAt: monthWindow(0) },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      db.concession.aggregate({
        where: { createdAt: monthWindow(0) },
        _sum: { value: true },
        _count: { _all: true }
      }),
      db.payment.findMany({
        where: { status: 'SUCCESS', paidAt: { gte: startOfToday } },
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
          date: { gte: monthsAgo12 }
        },
        select: { metric: true, date: true, amount: true }
      })
    ])

    const ageing = AGEING_BUCKETS.map(bucket => ({ bucket, count: 0, amount: 0 }))
    let outstanding = 0
    let overdueTotal = 0
    for (const inv of openInvoices) {
      const due = Number(inv.totalAmount) - Number(inv.paidAmount)
      if (due <= 0) continue
      outstanding += due
      if (!inv.dueDate || inv.dueDate >= startOfToday) continue
      overdueTotal += due
      const days = Math.floor((startOfToday.getTime() - inv.dueDate.getTime()) / 864e5)
      const slot = ageing.find(b => b.bucket === bucketFor(days))!
      slot.count++
      slot.amount += due
    }

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
      // MoM 90+ growth needs a stored snapshot of last month's buckets —
      // Phase 2 (needs ageing metric in rollups). Rule stays dormant.
      ninetyPlusGrowthPct: null,
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
      ageing,
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
