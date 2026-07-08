import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { redis } from '@/lib/redis'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { buildExecutiveAttention } from '@/lib/reports/insights'
import {
  ayScope, branchIdsFor, branchScope, monthWindow,
  OPEN_LEAD_STATUSES, OPEN_INVOICE_STATUSES
} from '@/lib/reports/queries/scope'

export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['ORG_ADMIN', 'BRANCH_ADMIN'],
  handler: async ({ req, user, db }) => {
    const { academicYearId } = parseQuery(req.url, { academicYearId: textParam })
    const branchIds = await branchIdsFor(user.id, user.role)

    const cacheKey = `rpt:dash:exec:${user.orgId}:${academicYearId ?? 'all'}:${branchIds?.join(',') ?? 'all'}`
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) return ok(JSON.parse(cached))

    // Resolve selected + previous academic year for YoY comparison.
    const years = await db.academicYear.findMany({
      orderBy: { startDate: 'asc' },
      select: { id: true, name: true, startDate: true, status: true }
    })
    const selected =
      years.find(y => y.id === academicYearId) ??
      years.find(y => y.status === 'ACTIVE') ??
      years[years.length - 1]
    const prev = selected
      ? [...years].reverse().find(y => y.startDate < selected.startDate)
      : undefined

    const ay = ayScope(selected?.id)
    // Strict AY match for the comparison year — legacy null-AY rows would
    // otherwise be double-counted into both sides of the delta.
    const ayPrev = prev ? { academicYearId: prev.id } : null
    const br = branchScope(branchIds)
    const now = new Date()
    const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const d14Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const d60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const monthsAgo12 = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [
      leadsTotal, leadsPrev,
      leadsConverted, leadsConvertedPrev,
      admitted, admittedPrev,
      capacityRows,
      collectedThisMonth, collectedLastMonth,
      openInvoiceAgg,
      funnelNow, funnelPrev,
      sourceAll, sourceConverted,
      admittedByGrade,
      rollups,
      uncontacted48h, overdue60Agg, stuckAdmissions
    ] = await Promise.all([
      db.lead.count({ where: { ...ay, ...br } }),
      ayPrev ? db.lead.count({ where: { ...ayPrev, ...br } }) : null,
      db.lead.count({ where: { ...ay, ...br, status: 'CONVERTED' } }),
      ayPrev ? db.lead.count({ where: { ...ayPrev, ...br, status: 'CONVERTED' } }) : null,
      db.admission.count({ where: { ...ay, ...br, status: 'ADMITTED' } }),
      ayPrev ? db.admission.count({ where: { ...ayPrev, ...br, status: 'ADMITTED' } }) : null,
      selected
        ? db.admissionCapacity.findMany({
            where: { academicYearId: selected.id, ...br },
            select: { gradeLabel: true, totalSeats: true, filledSeats: true }
          })
        : [],
      db.payment.aggregate({
        where: { ...br, status: 'SUCCESS', paidAt: monthWindow(0) },
        _sum: { amount: true }
      }),
      db.payment.aggregate({
        where: { ...br, status: 'SUCCESS', paidAt: monthWindow(-1) },
        _sum: { amount: true }
      }),
      db.invoice.aggregate({
        where: { ...br, status: { in: [...OPEN_INVOICE_STATUSES] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true }
      }),
      db.lead.groupBy({
        by: ['status'], where: { ...ay, ...br }, _count: { _all: true }
      }),
      ayPrev
        ? db.lead.groupBy({
            by: ['status'], where: { ...ayPrev, ...br }, _count: { _all: true }
          })
        : null,
      db.lead.groupBy({
        by: ['source'], where: { ...ay, ...br }, _count: { _all: true }
      }),
      db.lead.groupBy({
        by: ['source'], where: { ...ay, ...br, status: 'CONVERTED' }, _count: { _all: true }
      }),
      db.admission.groupBy({
        by: ['gradeSought'],
        where: { ...ay, ...br, status: 'ADMITTED' },
        _count: { _all: true }
      }),
      db.dailyRollup.findMany({
        where: {
          metric: { in: ['invoiced_amount', 'collected_amount'] },
          date: { gte: monthsAgo12 },
          ...br
        },
        select: { metric: true, date: true, amount: true }
      }),
      db.lead.count({
        where: {
          ...ay, ...br,
          firstContactedAt: null,
          status: { in: [...OPEN_LEAD_STATUSES] },
          createdAt: { lt: h48Ago }
        }
      }),
      db.invoice.aggregate({
        where: {
          ...br,
          status: { in: [...OPEN_INVOICE_STATUSES] },
          dueDate: { lt: d60Ago }
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true }
      }),
      db.admission.count({
        where: { ...ay, ...br, status: 'IN_PROGRESS', updatedAt: { lt: d14Ago } }
      })
    ])

    const outstanding =
      Number(openInvoiceAgg._sum.totalAmount ?? 0) -
      Number(openInvoiceAgg._sum.paidAmount ?? 0)

    const conversionPct = leadsTotal > 0 ? leadsConverted / leadsTotal : null
    const conversionPctPrev =
      leadsPrev && leadsPrev > 0 ? (leadsConvertedPrev ?? 0) / leadsPrev : null

    const capacityTotal = capacityRows.reduce((s, c) => s + c.totalSeats, 0)

    // Monthly billed-vs-collected trend from the rollup table.
    const trendMap = new Map<string, { billed: number; collected: number }>()
    for (const r of rollups) {
      const key = r.date.toISOString().slice(0, 7)
      const entry = trendMap.get(key) ?? { billed: 0, collected: 0 }
      if (r.metric === 'invoiced_amount') entry.billed += Number(r.amount ?? 0)
      else entry.collected += Number(r.amount ?? 0)
      trendMap.set(key, entry)
    }
    const feeTrend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    const funnelCount = (rows: typeof funnelNow | null, status: string) =>
      rows?.find(r => r.status === status)?._count._all ?? 0
    const funnel = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED']
      .map(status => ({
        status,
        count: funnelCount(funnelNow, status),
        prevCount: ayPrev ? funnelCount(funnelPrev, status) : null
      }))

    const convBySource = new Map(
      sourceConverted.map(r => [r.source, r._count._all])
    )
    const sources = sourceAll
      .map(r => ({
        source: r.source,
        leads: r._count._all,
        converted: convBySource.get(r.source) ?? 0,
        conversionPct: r._count._all > 0 ? (convBySource.get(r.source) ?? 0) / r._count._all : 0
      }))
      .sort((a, b) => b.leads - a.leads)

    const admittedMap = new Map(
      admittedByGrade.map(r => [r.gradeSought ?? 'Unspecified', r._count._all])
    )
    const capacity = capacityRows
      .map(c => ({
        grade: c.gradeLabel,
        totalSeats: c.totalSeats,
        filledSeats: c.filledSeats,
        admitted: admittedMap.get(c.gradeLabel) ?? 0
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }))

    const attention = buildExecutiveAttention({
      uncontacted48h,
      invoicesOverdue60d: overdue60Agg._count._all,
      overdue60dAmount:
        Number(overdue60Agg._sum.totalAmount ?? 0) -
        Number(overdue60Agg._sum.paidAmount ?? 0),
      gradesNearCapacity: capacityRows
        .filter(c => c.totalSeats > 0 && c.filledSeats / c.totalSeats >= 0.9)
        .map(c => ({ grade: c.gradeLabel, filled: c.filledSeats, total: c.totalSeats })),
      stuckAdmissions
    })

    const data = {
      year: selected ? { id: selected.id, name: selected.name } : null,
      compareYear: prev ? { id: prev.id, name: prev.name } : null,
      kpis: {
        leads: { value: leadsTotal, prev: leadsPrev },
        conversionPct: { value: conversionPct, prev: conversionPctPrev },
        admissions: { value: admitted, prev: admittedPrev, capacity: capacityTotal || null },
        collectedThisMonth: {
          value: Number(collectedThisMonth._sum.amount ?? 0),
          prev: Number(collectedLastMonth._sum.amount ?? 0)
        },
        outstanding: { value: outstanding, invoices: openInvoiceAgg._count._all }
      },
      funnel,
      feeTrend,
      sources,
      capacity,
      attention
    }

    await redis.set(cacheKey, JSON.stringify(data), 'EX', 120).catch(() => {})
    return ok(data)
  }
})
