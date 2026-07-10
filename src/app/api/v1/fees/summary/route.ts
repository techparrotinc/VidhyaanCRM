import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

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
    const monthWindow = month
      ? {
          gte: startOfMonth(parseISO(month + '-01')),
          lte: endOfMonth(parseISO(month + '-01'))
        }
      : null
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

    const [
      totalInvoices,
      statusCounts,
      totalCollected,
      totalOutstanding,
      totalBilledAgg,
      overdueAgg,
      scheduledAgg
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
      })
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
