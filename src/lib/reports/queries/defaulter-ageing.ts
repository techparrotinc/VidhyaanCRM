import { branchScope, OPEN_INVOICE_STATUSES } from './scope'
import { computeAgeing } from './ageing'
import {
  ReportQuery, ReportCtx, Filters, listFilter, offsetCursor, nextOffsetCursor
} from './types'

/** Bucket filter → dueDate window (relative to today). */
function bucketDueDateRange(bucket: string | undefined, startOfToday: Date) {
  if (!bucket) return { lt: startOfToday }
  const day = (n: number) => new Date(startOfToday.getTime() - n * 864e5)
  switch (bucket) {
    case '0-30': return { lt: startOfToday, gte: day(30) }
    case '31-60': return { lt: day(30), gte: day(60) }
    case '61-90': return { lt: day(60), gte: day(90) }
    case '90+': return { lt: day(90) }
    default: return { lt: startOfToday }
  }
}

function whereFor(ctx: ReportCtx, filters: Filters, startOfToday: Date) {
  const grades = listFilter(filters.grade)
  return {
    ...branchScope(ctx.branchIds),
    status: { in: [...OPEN_INVOICE_STATUSES] },
    dueDate: bucketDueDateRange(filters.bucket, startOfToday),
    ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
  }
}

export const defaulterAgeing: ReportQuery = {
  async summary(ctx, filters) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const grades = listFilter(filters.grade)
    // Whole open book (no row cap): balance math done over paged chunks.
    const ageing = await computeAgeing(
      ctx.db,
      {
        ...branchScope(ctx.branchIds),
        status: { in: [...OPEN_INVOICE_STATUSES] },
        ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
      },
      startOfToday
    )
    const ninetyPlus = ageing.buckets.find(b => b.bucket === '90+')!

    return {
      kpis: [
        { key: 'outstanding', label: 'Outstanding', value: ageing.outstanding, format: 'inr' },
        { key: 'overdue', label: 'Overdue', value: ageing.overdue, format: 'inr' },
        { key: 'defaulters', label: 'Students with Dues', value: ageing.defaulterCount, format: 'int' },
        { key: 'ninetyPlus', label: '90+ Days', value: ninetyPlus.amount, format: 'inr', caption: `${ninetyPlus.count} invoices` }
      ],
      insight:
        ninetyPlus.amount > 0 && ageing.overdue > 0
          ? `${Math.round((ninetyPlus.amount / ageing.overdue) * 100)}% of overdue money is 90+ days old — chase oldest first.`
          : null,
      charts: { ageing: ageing.buckets }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const offset = offsetCursor(cursor)
    const minAmount = filters.minAmount ? Number(filters.minAmount) : 0

    // Balance (total − paid) is a computed column and can't be a SQL filter,
    // so a page may drop a few zero-balance / below-minAmount rows after
    // fetch. The cursor MUST advance by the raw fetch size (invoices.length),
    // never by the post-filter row count — otherwise the skipped invoices are
    // lost from the next page (and from exports). Pages are thus at most
    // `limit` rows and occasionally shorter; nothing is skipped.
    const invoices = await ctx.db.invoice.findMany({
      where: whereFor(ctx, filters, startOfToday),
      select: {
        id: true, invoiceNumber: true, dueDate: true, totalAmount: true, paidAmount: true,
        student: {
          select: {
            studentCode: true, name: true, gradeLabel: true,
            section: true, guardianPhone: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: offset,
      take: limit
    })

    const rows = invoices
      .map(inv => {
        const amountDue = Number(inv.totalAmount) - Number(inv.paidAmount)
        return {
          __href: `/fee-management/${inv.id}`,
          studentCode: inv.student.studentCode,
          student: inv.student.name,
          grade: [inv.student.gradeLabel, inv.student.section].filter(Boolean).join(' · '),
          guardianPhone: inv.student.guardianPhone ?? '',
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          daysOverdue: inv.dueDate
            ? Math.max(0, Math.floor((startOfToday.getTime() - inv.dueDate.getTime()) / 864e5))
            : 0,
          amountDue
        }
      })
      .filter(r => r.amountDue > 0 && r.amountDue >= minAmount)

    return {
      columns: [
        { key: 'studentCode', label: 'Student Code' },
        { key: 'student', label: 'Student' },
        { key: 'grade', label: 'Grade' },
        { key: 'guardianPhone', label: 'Guardian Phone' },
        { key: 'invoiceNumber', label: 'Invoice' },
        { key: 'dueDate', label: 'Due Date', format: 'date' },
        { key: 'daysOverdue', label: 'Days Overdue', format: 'int' },
        { key: 'amountDue', label: 'Amount Due', format: 'inr' }
      ],
      rows,
      nextCursor: nextOffsetCursor(offset, limit, invoices.length)
    }
  }
}
