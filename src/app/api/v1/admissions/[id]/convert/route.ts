import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const convertSchema = z.object({
  name: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  gradeLabel: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
})

export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, params, academicYearId }) => {
    const admission = await db.admission.findFirst({
      where: { id: params?.id },
      include: { stage: true }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    const isAdmitted = admission.status === 'ADMITTED'
    const isWon = admission.stage?.isWon === true

    if (!isAdmitted && !isWon) {
      throw Errors.businessRule(
        'Admission must be in Admitted status or Won stage before converting to student'
      )
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      // Allow empty request body
    }

    const parsed = convertSchema.safeParse(body)
    const inputData = parsed.success ? parsed.data : {}

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
        name: inputData.name || admission.applicantName,
        guardianPhone: admission.phone ?? null,
        guardianEmail: admission.email ?? null,
        gradeLabel: (inputData.gradeLabel || admission.gradeSought) ?? null,
        studentCode,
        status: 'ACTIVE',
        academicYearId: admission.academicYearId ?? academicYearId ?? null,
        rollNumber: inputData.rollNumber ?? null,
        guardianName: inputData.guardianName ?? null,
        dateOfBirth: inputData.dateOfBirth ? new Date(inputData.dateOfBirth) : null
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
