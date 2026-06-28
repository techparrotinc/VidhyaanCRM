import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, academicYearId }) => {
    const where: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    const [
      totalInvoices,
      statusCounts,
      totalCollected,
      totalOutstanding
    ] = await Promise.all([
      db.invoice.count({ where }),
      db.invoice.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      db.payment.aggregate({
        where: {
          orgId: user.orgId,
          status: 'SUCCESS',
          deletedAt: null,
          invoice: {
            academicYearId: academicYearId ?? undefined
          }
        },
        _sum: { amount: true }
      }),
      db.invoice.aggregate({
        where: {
          ...where,
          status: {
            in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE', 'SCHEDULED']
          }
        },
        _sum: {
          totalAmount: true,
          paidAmount: true
        }
      })
    ])

    const outstanding =
      Number(totalOutstanding._sum.totalAmount ?? 0) -
      Number(totalOutstanding._sum.paidAmount ?? 0)

    return ok({
      totalInvoices,
      collected: Number(totalCollected._sum.amount ?? 0),
      outstanding,
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
