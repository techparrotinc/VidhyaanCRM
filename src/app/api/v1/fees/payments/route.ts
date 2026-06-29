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
  handler: async ({ db, user }) => {
    const payments = await db.payment.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: { paidAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            gradeLabel: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        }
      }
    })
    return ok(payments)
  }
})
