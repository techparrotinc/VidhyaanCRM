import { prisma } from '@/lib/db/client'
import {
  ReportQuery, ReportCtx, Filters, rangeFilter, offsetCursor, nextOffsetCursor
} from './types'

function whereFor(_ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  return {
    ...(range ? { createdAt: range } : {}),
    ...(filters.type ? { type: filters.type as never } : {})
  }
}

export const concessionAudit: ReportQuery = {
  async summary(ctx, filters) {
    const where = whereFor(ctx, filters)
    const range = rangeFilter(filters)

    const [byType, byGrantor, billed] = await Promise.all([
      ctx.db.concession.groupBy({
        by: ['type'], where, _sum: { value: true }, _count: { _all: true }
      }),
      ctx.db.concession.groupBy({
        by: ['approvedById'], where, _sum: { value: true }, _count: { _all: true }
      }),
      ctx.db.invoice.aggregate({
        where: { ...(range ? { createdAt: range } : {}) },
        _sum: { totalAmount: true }
      })
    ])

    // Percentage-type rows hold a percent value, not rupees — only
    // FIXED_AMOUNT sums are money.
    const fixed = byType.find(r => r.type === 'FIXED_AMOUNT')
    const pct = byType.find(r => r.type === 'PERCENTAGE')
    const fixedAmount = Number(fixed?._sum.value ?? 0)
    const totalCount = byType.reduce((s, r) => s + r._count._all, 0)
    const billedSum = Number(billed._sum.totalAmount ?? 0)

    const topGrantor = [...byGrantor]
      .filter(g => g.approvedById)
      .sort((a, b) => b._count._all - a._count._all)[0]
    let topGrantorName: string | null = null
    if (topGrantor?.approvedById) {
      const u = await prisma.user.findFirst({
        where: { id: topGrantor.approvedById, orgId: ctx.orgId },
        select: { name: true }
      })
      topGrantorName = u?.name ?? null
    }

    return {
      kpis: [
        { key: 'amount', label: 'Concessions (₹)', value: fixedAmount, format: 'inr', caption: 'fixed-amount only' },
        { key: 'count', label: 'Granted', value: totalCount, format: 'int', caption: pct ? `incl. ${pct._count._all} percentage-type` : undefined },
        { key: 'ofBilled', label: '% of Billed', value: billedSum > 0 ? fixedAmount / billedSum : null, format: 'pct' },
        { key: 'topGrantor', label: 'Top Grantor', value: topGrantorName ?? '—', format: 'text', caption: topGrantor ? `${topGrantor._count._all} concessions` : undefined }
      ],
      insight:
        billedSum > 0 && fixedAmount / billedSum > 0.1
          ? `Concessions are ${Math.round((fixedAmount / billedSum) * 100)}% of billing in this period — above the 10% comfort line.`
          : null,
      charts: {
        byType: byType.map(r => ({
          type: r.type,
          count: r._count._all,
          value: Number(r._sum.value ?? 0)
        }))
      }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const concessions = await ctx.db.concession.findMany({
      where: whereFor(ctx, filters),
      select: {
        createdAt: true, type: true, value: true, reason: true, approvedById: true,
        student: { select: { name: true, gradeLabel: true } },
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    const grantorIds = [...new Set(concessions.map(c => c.approvedById).filter(Boolean))] as string[]
    const users = grantorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: grantorIds }, orgId: ctx.orgId },
          select: { id: true, name: true }
        })
      : []
    const nameMap = new Map(users.map(u => [u.id, u.name]))

    return {
      columns: [
        { key: 'createdAt', label: 'Date', format: 'date' },
        { key: 'student', label: 'Student' },
        { key: 'grade', label: 'Grade' },
        { key: 'type', label: 'Type', format: 'badge' },
        { key: 'value', label: 'Value', format: 'text' },
        { key: 'reason', label: 'Reason' },
        { key: 'approvedBy', label: 'Granted By' },
        { key: 'invoiceNumber', label: 'Invoice' }
      ],
      rows: concessions.map(c => ({
        createdAt: c.createdAt,
        student: c.student?.name ?? '—',
        grade: c.student?.gradeLabel ?? '',
        type: c.type === 'FIXED_AMOUNT' ? 'Fixed' : 'Percentage',
        value: c.type === 'FIXED_AMOUNT'
          ? `₹${Number(c.value).toLocaleString('en-IN')}`
          : `${Number(c.value)}%`,
        reason: c.reason ?? '',
        approvedBy: c.approvedById ? nameMap.get(c.approvedById) ?? '—' : '—',
        invoiceNumber: c.invoice?.invoiceNumber ?? ''
      })),
      nextCursor: nextOffsetCursor(offset, limit, concessions.length)
    }
  }
}
