import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendOrgTemplateEmail } from '@/lib/mail/org-templates'
import { getGradeLabel } from '@/constants/grades'
import { assertFreeTierLimit } from '@/lib/billing/limits'

const convertSchema = z.object({
  name: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  gradeLabel: z.string().optional().nullable(),
  // Matches the cap on the student create/update/promote routes — was
  // max(10) here, a stricter, inconsistent limit on the same field.
  section: z.string().max(50).optional().nullable(),
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

    // Student.admissionId is unique at the schema level (the real guard under
    // concurrent requests) — this pre-check just turns the common case into a
    // clean 409 instead of a raw P2002-driven 500.
    const alreadyConverted = await db.student.findFirst({
      where: { admissionId: admission.id },
      select: { id: true, studentCode: true }
    })
    if (alreadyConverted) {
      throw Errors.conflict(
        `This admission was already converted to student ${alreadyConverted.studentCode}`
      )
    }

    // Converting creates a Student row — same free-tier cap as the direct
    // create route, previously bypassable through this path.
    await assertFreeTierLimit(user.orgId, 'STUDENT')

    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      // Allow empty request body
    }

    const parsed = convertSchema.safeParse(body)
    const inputData = parsed.success ? parsed.data : {}

    // Generate student code from the numeric max, not count()+1 — counts
    // undercount after soft deletes and collide on the unique constraint
    const year = new Date().getFullYear()
    const prefix = `STU-${year}-`
    const codeRows = await prisma.$queryRaw<{ max: number | null }[]>`
      SELECT MAX(CAST(SUBSTRING(student_code FROM ${prefix.length + 1}::int) AS INTEGER)) AS max
      FROM crm.students
      WHERE org_id = ${user.orgId}
        AND student_code ~ ${'^' + prefix + '[0-9]+$'}
    `
    const studentCode =
      prefix + String(Number(codeRows[0]?.max ?? 0) + 1).padStart(5, '0')

    // Create student from admission
    const student = await db.student.create({
      data: {
        orgId: user.orgId,
        admissionId: admission.id,
        name: inputData.name || admission.applicantName,
        guardianPhone: admission.phone ?? null,
        guardianEmail: admission.email ?? null,
        // Admissions inherit raw lead grade values ("lkg"); students store
        // display labels ("LKG") — normalise or the student is invisible to
        // the promote wizard and class-mode fee targeting.
        gradeLabel: (() => {
          const g = inputData.gradeLabel || admission.gradeSought
          return g ? getGradeLabel(g) : null
        })(),
        studentCode,
        status: 'ACTIVE',
        academicYearId: admission.academicYearId ?? academicYearId ?? null,
        rollNumber: inputData.rollNumber ?? null,
        section: inputData.section?.trim() || null,
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

    // Welcome email to the guardian (fire-and-forget)
    if (student.guardianEmail) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://app-dev.vidhyaan.com'
      prisma.organization.findUnique({ where: { id: user.orgId }, select: { name: true } }).then((org) =>
        sendOrgTemplateEmail(user.orgId, 'WELCOME_STUDENT', student.guardianEmail, {
          parentName: student.guardianName ?? 'Parent',
          studentName: student.name,
          studentCode,
          gradeLabel: student.gradeLabel ?? '',
          schoolName: org?.name ?? 'Your school',
          portalLink: `${baseUrl}/parent/dashboard`
        })
      ).catch(() => {})
    }

    return created({
      student,
      message: 'Student record created: ' + studentCode
    })
  }
})
