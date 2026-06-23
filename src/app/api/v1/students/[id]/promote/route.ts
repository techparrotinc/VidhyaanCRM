import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const POST = route({
  module: MODULES.STUDENT_LIFECYCLE,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, params }) => {
    const body = z.object({
      newClass: z.string().min(1),
      newSection: z.string().optional(),
      newRollNumber: z.string().optional(),
      academicYearId: z.string()
    }).parse(await req.json())

    const student = await db.student.findFirst({
      where: { id: params?.id }
    })

    if (!student) {
      throw Errors.notFound('Student')
    }

    const updated = await db.student.update({
      where: { id: params?.id },
      data: {
        gradeLabel: body.newClass,
        rollNumber: body.newRollNumber ?? student.rollNumber,
        academicYearId: body.academicYearId
      }
    })

    return ok({
      student: updated,
      message: student.name + ' promoted to ' + body.newClass
    })
  }
})
