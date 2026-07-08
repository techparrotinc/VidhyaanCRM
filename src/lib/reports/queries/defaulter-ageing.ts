import { branchScope, OPEN_INVOICE_STATUSES } from './scope'
import {
  ReportQuery, ReportCtx, Filters, listFilter, offsetCursor, nextOffsetCursor
} from './types'

const BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const

function bucketFor(days: number): (typeof BUCKETS)[number] {
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

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
    // Buckets need per-invoice balance math (total − paid) — bounded fetch.
    const open = await ctx.db.invoice.findMany({
      where: {
        ...branchScope(ctx.branchIds),
        status: { in: [...OPEN_INVOICE_STATUSES] }
      },
      select: { dueDate: true, totalAmount: true, paidAmount: true, studentId: true },
      take: 5000
    })

    const ageing = BUCKETS.map(bucket => ({ bucket, count: 0, amount: 0 }))
    let outstanding = 0
    let overdue = 0
    const defaulters = new Set<string>()
    for (const inv of open) {
      const due = Number(inv.totalAmount) - Number(inv.paidAmount)
      if (due <= 0) continue
      outstanding += due
      if (!inv.dueDate || inv.dueDate >= startOfToday) continue
      overdue += due
      defaulters.add(inv.studentId)
      const days = Math.floor((startOfToday.getTime() - inv.dueDate.getTime()) / 864e5)
      const slot = ageing.find(b => b.bucket === bucketFor(days))!
      slot.count++
      slot.amount += due
    }

    const ninetyPlus = ageing.find(b => b.bucket === '90+')!

    return {
      kpis: [
        { key: 'outstanding', label: 'Outstanding', value: outstanding, format: 'inr' },
        { key: 'overdue', label: 'Overdue', value: overdue, format: 'inr' },
        { key: 'defaulters', label: 'Students with Dues', value: defaulters.size, format: 'int' },
        { key: 'ninetyPlus', label: '90+ Days', value: ninetyPlus.amount, format: 'inr', caption: `${ninetyPlus.count} invoices` }
      ],
      insight:
        ninetyPlus.amount > 0 && overdue > 0
          ? `${Math.round((ninetyPlus.amount / overdue) * 100)}% of overdue money is 90+ days old — chase oldest first.`
          : null,
      charts: { ageing }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const offset = offsetCursor(cursor)
    const minAmount = filters.minAmount ? Number(filters.minAmount) : 0

    // Balance is a computed column — over-fetch, filter, slice.
    const invoices = await ctx.db.invoice.findMany({
      where: whereFor(ctx, filters, startOfToday),
      select: {
        invoiceNumber: true, dueDate: true, totalAmount: true, paidAmount: true,
        student: {
          select: {
            studentCode: true, name: true, gradeLabel: true,
            section: true, guardianPhone: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: offset,
      take: limit * 3
    })

    const rows = invoices
      .map(inv => {
        const amountDue = Number(inv.totalAmount) - Number(inv.paidAmount)
        return {
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
      .slice(0, limit)

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
      nextCursor: nextOffsetCursor(offset, limit * 3, invoices.length)
    }
  }
}
