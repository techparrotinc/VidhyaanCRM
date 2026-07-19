import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { istRange } from '@/lib/api/query'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const termId = searchParams.get('termId') ?? undefined
    const month = searchParams.get('month') ?? undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const studentId = searchParams.get('studentId') ?? undefined
    const academicYearIdParam = searchParams.get('academicYearId') ?? undefined

    const baseWhere: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (studentId) {
      baseWhere.studentId = studentId
    }
    // AY scoping mirrors the invoices list route (legacy null-AY invoices
    // included under every year) so the summary agrees with the visible list.
    if (academicYearIdParam) {
      baseWhere.AND = [
        { OR: [{ academicYearId: academicYearIdParam }, { academicYearId: null }] }
      ]
    }
    if (termId && termId !== 'all') {
      baseWhere.termId = termId
    }
    if (courseId && courseId !== 'all') {
      baseWhere.courseId = courseId
    }
    if (gradeLabel && gradeLabel !== 'all') {
      baseWhere.student = {
        gradeLabel
      }
    }
    // Arbitrary day range (IST) takes precedence over the month shortcut —
    // lets callers ask "collection this week / today", not just whole months.
    const fromParam = searchParams.get('from') ?? undefined
    const toParam = searchParams.get('to') ?? undefined
    const dayWindow =
      [fromParam, toParam].filter(Boolean).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d!))
        ? istRange(fromParam, toParam)
        : undefined
    const monthWindow =
      dayWindow ??
      (month
        ? {
            gte: startOfMonth(parseISO(month + '-01')),
            lte: endOfMonth(parseISO(month + '-01'))
          }
        : null)
    if (monthWindow) {
      baseWhere.createdAt = monthWindow
    }

    const where = { ...baseWhere }
    if (status && status !== '') {
      where.status = status
    }

    // "Collected" is cash received in the selected month (payments by paidAt),
    // matching the dashboard tile — NOT payments attached to invoices created
    // that month. Other filters still scope through the invoice relation.
    const { createdAt: _cohortMonth, ...invoiceScopeSansMonth } = baseWhere
    const collectedWhere: any = {
      orgId: user.orgId,
      status: 'SUCCESS',
      deletedAt: null,
      invoice: invoiceScopeSansMonth
    }
    if (monthWindow) {
      collectedWhere.paidAt = monthWindow
    }

    // Overdue must be derived (due date passed, not settled) — the stored
    // OVERDUE status only flips when the overdue endpoint runs, and past-due
    // SCHEDULED invoices never flip. Mirrors isInvoiceOverdue() on the rows.
    const now = new Date()
    const overdueWhere = {
      ...baseWhere,
      status: { notIn: ['PAID', 'WAIVED'] },
      dueDate: { lt: now }
    }

    // Carry-forward dues: unsettled invoices that belong to OTHER academic
    // years (e.g. a promoted student's last-year balance). They're excluded
    // from the year-scoped KPIs above, so surface them as their own metric.
    // Null-AY invoices already show under every year and aren't arrears.
    const arrearsWhere: any = academicYearIdParam
      ? {
          orgId: user.orgId,
          deletedAt: null,
          academicYearId: { not: academicYearIdParam },
          NOT: { academicYearId: null },
          status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
          ...(studentId ? { studentId } : {}),
          student: { status: 'ACTIVE', deletedAt: null, ...(gradeLabel && gradeLabel !== 'all' ? { gradeLabel } : {}) }
        }
      : null

    const [
      totalInvoices,
      statusCounts,
      totalCollected,
      totalOutstanding,
      totalBilledAgg,
      overdueAgg,
      scheduledAgg,
      arrearsAgg
    ] = await Promise.all([
      db.invoice.count({ where }),
      db.invoice.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true }
      }),
      db.payment.aggregate({
        where: collectedWhere,
        _sum: { amount: true }
      }),
      db.invoice.aggregate({
        where: {
          ...baseWhere,
          status: {
            in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE', 'SCHEDULED']
          }
        },
        _sum: {
          totalAmount: true,
          paidAmount: true
        }
      }),
      db.invoice.aggregate({
        where: baseWhere,
        _sum: { totalAmount: true, paidAmount: true }
      }),
      db.invoice.aggregate({
        where: overdueWhere,
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true }
      }),
      db.invoice.aggregate({
        where: { ...baseWhere, status: 'SCHEDULED' },
        _sum: { totalAmount: true }
      }),
      arrearsWhere
        ? db.invoice.aggregate({
            where: arrearsWhere,
            _sum: { totalAmount: true, paidAmount: true },
            _count: { id: true }
          })
        : Promise.resolve(null)
    ])

    const outstanding =
      Number(totalOutstanding._sum.totalAmount ?? 0) -
      Number(totalOutstanding._sum.paidAmount ?? 0)

    const overdueAmount =
      Number(overdueAgg._sum.totalAmount ?? 0) -
      Number(overdueAgg._sum.paidAmount ?? 0)

    return ok({
      totalInvoices,
      collected: Number(totalCollected._sum.amount ?? 0),
      // paid against invoices in the current (month-)cohort — lets the UI
      // show how much of the cash relates to the invoices actually listed
      cohortCollected: Number(totalBilledAgg._sum.paidAmount ?? 0),
      outstanding,
      totalBilled: Number(totalBilledAgg._sum.totalAmount ?? 0),
      overdueAmount,
      overdueCount: overdueAgg._count.id,
      scheduledAmount: Number(scheduledAgg._sum.totalAmount ?? 0),
      // dues carried over from other academic years (active students only)
      arrearsAmount: arrearsAgg
        ? Number(arrearsAgg._sum.totalAmount ?? 0) - Number(arrearsAgg._sum.paidAmount ?? 0)
        : 0,
      arrearsCount: arrearsAgg?._count.id ?? 0,
      statusCounts: statusCounts.reduce(
        (acc, s) => ({
          ...acc,
          [s.status]: s._count.id
        }),
        {} as Record<string, number>
      )
    })
  }
})
