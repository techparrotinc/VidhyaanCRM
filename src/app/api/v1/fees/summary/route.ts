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

    const baseWhere: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (studentId) {
      baseWhere.studentId = studentId
    }
    // NOTE: no academicYearId scoping here — the invoices list route does not
    // apply it either, and the summary must agree with the visible list.
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
    if (month) {
      baseWhere.createdAt = {
        gte: startOfMonth(parseISO(month + '-01')),
        lte: endOfMonth(parseISO(month + '-01'))
      }
    }

    const where = { ...baseWhere }
    if (status && status !== '') {
      where.status = status
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
        where: {
          orgId: user.orgId,
          status: 'SUCCESS',
          deletedAt: null,
          invoice: baseWhere
        },
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
        _sum: { totalAmount: true }
      }),
      db.invoice.aggregate({
        where: { ...baseWhere, status: 'OVERDUE' },
        _sum: { totalAmount: true, paidAmount: true }
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
      outstanding,
      totalBilled: Number(totalBilledAgg._sum.totalAmount ?? 0),
      overdueAmount,
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
