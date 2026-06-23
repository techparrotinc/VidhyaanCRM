import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { StudentStatus } from '@prisma/client'

export const POST = route({
  module: MODULES.STUDENT_LIFECYCLE,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, params }) => {
    const student = await db.student.findFirst({
      where: { id: params?.id }
    })

    if (!student) {
      throw Errors.notFound('Student')
    }

    if (student.status === 'ALUMNI') {
      throw Errors.businessRule('Student is already an alumni')
    }

    const portalRevokeDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    const updated = await db.student.update({
      where: { id: params?.id },
      data: {
        status: 'ALUMNI' as StudentStatus,
        portalAccessRevokedAt: portalRevokeDate,
        alumniSince: new Date()
      }
    })

    return ok({
      student: updated,
      message: student.name + ' marked as alumni. Portal access will be removed in 60 days.'
    })
  }
})
