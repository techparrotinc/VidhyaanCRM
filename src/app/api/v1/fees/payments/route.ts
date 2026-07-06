import { route } from '@/lib/api/compose'
import { paginated } from '@/lib/api/respond'
import { parseQuery, paginationShape, textParam } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      ...paginationShape,
      studentId: textParam
    })

    const where = {
      orgId: user.orgId,
      deletedAt: null,
      ...(q.studentId ? { studentId: q.studentId } : {})
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
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
      }),
      db.payment.count({ where })
    ])

    return paginated(payments, total, q.page, q.limit)
  }
})
