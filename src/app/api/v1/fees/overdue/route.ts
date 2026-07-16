import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { InvoiceStatus } from '@prisma/client'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db }) => {
    const now = new Date()

    // OVERDUE must be included: the updateMany below flips rows to OVERDUE,
    // so a query for only UNPAID/PARTIALLY_PAID returns zero from the second
    // call onward (this exact bug blanked the mobile Fees tab).
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: {
          in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] as InvoiceStatus[]
        },
        dueDate: { lt: now },
        deletedAt: null
      },
      orderBy: { dueDate: 'asc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            gradeLabel: true,
            guardianPhone: true
          }
        }
      }
    })

    await db.invoice.updateMany({
      where: {
        status: {
          in: ['UNPAID' as InvoiceStatus, 'PARTIALLY_PAID' as InvoiceStatus]
        },
        dueDate: { lt: now },
        deletedAt: null
      },
      data: { status: 'OVERDUE' as InvoiceStatus }
    })

    const totalOverdue = overdueInvoices.reduce((sum, inv) =>
      sum + Number(inv.totalAmount), 0
    )

    return ok({
      invoices: overdueInvoices,
      count: overdueInvoices.length,
      totalOverdue
    })
  }
})
