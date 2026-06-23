import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { InvoiceStatus, PaymentStatus } from '@prisma/client'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user }) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      collected,
      overdue,
      upcoming,
      paidCount,
      overdueCount,
      dueSoonCount
    ] = await Promise.all([
      db.payment.aggregate({
        where: {
          status: 'SUCCESS' as PaymentStatus,
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { amount: true }
      }),
      db.invoice.aggregate({
        where: {
          status: 'OVERDUE' as InvoiceStatus,
          deletedAt: null
        },
        _sum: { totalAmount: true }
      }),
      db.invoice.aggregate({
        where: {
          status: 'UNPAID' as InvoiceStatus,
          dueDate: {
            gte: now,
            lte: next7Days
          },
          deletedAt: null
        },
        _sum: { totalAmount: true }
      }),
      db.invoice.count({
        where: {
          status: 'PAID' as InvoiceStatus,
          deletedAt: null
        }
      }),
      db.invoice.count({
        where: {
          status: 'OVERDUE' as InvoiceStatus,
          deletedAt: null
        }
      }),
      db.invoice.count({
        where: {
          status: 'UNPAID' as InvoiceStatus,
          dueDate: {
            gte: now,
            lte: next7Days
          },
          deletedAt: null
        }
      })
    ])

    return ok({
      collected: Number(collected._sum.amount ?? 0),
      overdue: Number(overdue._sum.totalAmount ?? 0),
      upcoming: Number(upcoming._sum.totalAmount ?? 0),
      students: {
        paid: paidCount,
        overdue: overdueCount,
        dueSoon: dueSoonCount
      }
    })
  }
})
