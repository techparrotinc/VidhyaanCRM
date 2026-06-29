import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.COUNSELLOR
  ],
  handler: async ({ db, user }) => {
    const grades = await db.invoice.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      select: {
        student: {
          select: { gradeLabel: true }
        }
      },
      distinct: ['studentId']
    })

    const uniqueGrades = [...new Set(
      grades
        .map(i => i.student?.gradeLabel)
        .filter(Boolean)
    )].sort() as string[]

    return ok({
      grades: uniqueGrades
    })
  }
})
