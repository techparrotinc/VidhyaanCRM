import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'

export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user, params, academicYearId }) => {
    const admission = await db.admission.findFirst({
      where: { id: params?.id }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    if (admission.status !== 'ADMITTED') {
      throw Errors.businessRule(
        'Admission must be in Admitted status before converting to student'
      )
    }

    // Generate student code
    const year = new Date().getFullYear()
    const count = await prisma.student.count({
      where: { orgId: user.orgId }
    })

    const studentCode =
      'STU-' + year + '-' + String(count + 1).padStart(5, '0')

    // Create student from admission
    const student = await db.student.create({
      data: {
        orgId: user.orgId,
        admissionId: admission.id,
        name: admission.applicantName,
        guardianPhone: admission.phone ?? null,
        guardianEmail: admission.email ?? null,
        gradeLabel: admission.gradeSought ?? null,
        studentCode,
        status: 'ACTIVE',
        academicYearId: admission.academicYearId ?? academicYearId ?? null
      }
    })

    // Log activity
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: admission.id,
        type: 'SYSTEM',
        summary: 'Converted to student: ' + studentCode,
        performedById: user.id
      }
    })

    return created({
      student,
      message: 'Student record created: ' + studentCode
    })
  }
})
