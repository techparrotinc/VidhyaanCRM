import { prisma } from '@/lib/db/client'
import { branchScope } from './scope'
import { ReportQuery, ReportCtx, Filters, rangeFilter, offsetCursor, nextOffsetCursor } from './types'

// Accountant's reconciliation register: every payment in the period, by
// method and collector. Default period = today (that's the daily ritual).

function whereFor(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  return {
    ...branchScope(ctx.branchIds),
    paidAt: range ?? { gte: startOfToday },
    status: (filters.status ?? 'SUCCESS') as never,
    ...(filters.method ? { method: filters.method as never } : {})
  }
}

const DIGITAL_METHODS = ['RAZORPAY', 'UPI', 'CARD', 'NEFT', 'BANK_TRANSFER']

export const paymentRegister: ReportQuery = {
  async summary(ctx, filters) {
    const where = whereFor(ctx, filters)
    const [total, byMethod, refunds, daily] = await Promise.all([
      ctx.db.payment.aggregate({
        where, _sum: { amount: true }, _count: { _all: true }
      }),
      ctx.db.payment.groupBy({
        by: ['method'], where, _sum: { amount: true }, _count: { _all: true }
      }),
      ctx.db.payment.aggregate({
        where: { ...where, refundedAmount: { gt: 0 } },
        _sum: { refundedAmount: true }
      }),
      ctx.db.payment.findMany({
        where, select: { paidAt: true, amount: true }, take: 5000
      })
    ])

    const cash = byMethod
      .filter(m => m.method === 'CASH')
      .reduce((s, m) => s + Number(m._sum.amount ?? 0), 0)
    const digital = byMethod
      .filter(m => DIGITAL_METHODS.includes(m.method as string))
      .reduce((s, m) => s + Number(m._sum.amount ?? 0), 0)

    const byDay = new Map<string, number>()
    for (const p of daily) {
      if (!p.paidAt) continue
      const key = p.paidAt.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) ?? 0) + Number(p.amount))
    }

    return {
      kpis: [
        { key: 'total', label: 'Collected', value: Number(total._sum.amount ?? 0), format: 'inr', caption: `${total._count._all} payments` },
        { key: 'cash', label: 'Cash', value: cash, format: 'inr', caption: 'physical reconciliation' },
        { key: 'digital', label: 'Digital', value: digital, format: 'inr', caption: 'gateway/UPI/bank' },
        { key: 'refunds', label: 'Refunded', value: Number(refunds._sum.refundedAmount ?? 0), format: 'inr' }
      ],
      insight:
        cash > 0 && cash > digital
          ? `Cash is ${Math.round((cash / (cash + digital)) * 100)}% of collections in this period — heavier manual reconciliation load.`
          : null,
      charts: {
        methodMix: byMethod
          .map(m => ({
            method: m.method as string,
            amount: Number(m._sum.amount ?? 0),
            count: m._count._all
          }))
          .sort((a, b) => b.amount - a.amount),
        daily: [...byDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, amount]) => ({ day: day.slice(5), amount }))
      }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const payments = await ctx.db.payment.findMany({
      where: whereFor(ctx, filters),
      select: {
        receiptNumber: true, paidAt: true, amount: true, method: true,
        status: true, createdById: true,
        student: { select: { name: true, gradeLabel: true } },
        invoice: { select: { id: true, invoiceNumber: true } }
      },
      orderBy: { paidAt: 'desc' },
      skip: offset,
      take: limit
    })

    const collectorIds = [...new Set(payments.map(p => p.createdById).filter(Boolean))] as string[]
    const users = collectorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: collectorIds }, orgId: ctx.orgId },
          select: { id: true, name: true }
        })
      : []
    const nameMap = new Map(users.map(u => [u.id, u.name]))

    return {
      columns: [
        { key: 'receiptNumber', label: 'Receipt' },
        { key: 'paidAt', label: 'Date', format: 'date' },
        { key: 'student', label: 'Student' },
        { key: 'grade', label: 'Grade' },
        { key: 'invoiceNumber', label: 'Invoice' },
        { key: 'method', label: 'Method', format: 'badge' },
        { key: 'status', label: 'Status', format: 'badge' },
        { key: 'amount', label: 'Amount', format: 'inr' },
        { key: 'collectedBy', label: 'Collected By' }
      ],
      rows: payments.map(p => ({
        __href: `/fee-management/${p.invoice.id}`,
        receiptNumber: p.receiptNumber,
        paidAt: p.paidAt,
        student: p.student?.name ?? '—',
        grade: p.student?.gradeLabel ?? '',
        invoiceNumber: p.invoice.invoiceNumber,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        collectedBy: p.createdById ? nameMap.get(p.createdById) ?? '—' : 'Online'
      })),
      nextCursor: nextOffsetCursor(offset, limit, payments.length)
    }
  }
}
