import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { Gender, StudentStatus } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { parseQuery, paginationShape, enumParam } from '@/lib/api/query'
import { getGradeLabel } from '@/constants/grades'
import { assertFreeTierLimit } from '@/lib/billing/limits'
import { findMatches, loadDedupConfig, dedupFields } from '@/lib/dedup'
import { assertNotDuplicate } from '@/lib/dedup/guard'

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST,
    ROLES.TEACHER
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const { page, limit, status } = parseQuery(req.url, {
      ...paginationShape,
      status: enumParam(StudentStatus)
    })
    const rawGradeParam = searchParams.get('gradeLabel') ?? searchParams.get('grade') ?? undefined
    const gradeLabel = rawGradeParam ? getGradeLabel(rawGradeParam) : undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined
    const section = searchParams.get('section') ?? undefined
    const countOnly = searchParams.get('countOnly') === 'true'

    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (gradeLabel) {
      where.gradeLabel = gradeLabel
    }
    if (academicYearId) {
      // Legacy students predate AY stamping — include them under every year.
      // AND-wrapped so it composes with the search OR below.
      where.AND = [
        { OR: [{ academicYearId }, { academicYearId: null }] }
      ]
    }
    if (section) {
      where.section = { equals: section, mode: 'insensitive' }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentCode: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (countOnly) {
      const count = await db.student.count({ where })
      return ok({ count })
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentCode: true,
          name: true,
          gradeLabel: true,
          guardianName: true,
          guardianPhone: true,
          gender: true,
          status: true,
          rollNumber: true,
          section: true,
          academicYearId: true,
          createdAt: true,
          branch: {
            select: { id: true, name: true }
          },
          academicYear: {
            select: { id: true, name: true }
          },
          admission: {
            select: {
              id: true,
              admissionCode: true
            }
          }
        }
      }),
      db.student.count({ where })
    ])

    return paginated(students, total, page, limit)
  }
})

const createStudentSchema = z.object({
  name: z.string().min(1),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gradeLabel: z.string().optional(),
  rollNumber: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  academicYearId: z.string().optional(),
  admissionId: z.string().optional(),
  status: z.enum([
    'ACTIVE',
    'ALUMNI',
    'TRANSFERRED',
    'SUSPENDED',
    'DROPPED_OUT'
  ]).optional().default('ACTIVE'),
  notes: z.string().optional(),
  // "Create anyway" override for soft dedup matches
  force: z.boolean().optional()
})

export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const body = createStudentSchema.parse(await req.json())

    await assertFreeTierLimit(user.orgId, 'STUDENT')

    const resolvedYear = body.academicYearId ?? academicYearId ?? null

    // Dedup guard + household identity (keyed on the guardian phone).
    const dedupConfig = await loadDedupConfig(db, user.orgId)
    const dedup = await findMatches(db, {
      orgId: user.orgId,
      phone: body.guardianPhone,
      email: body.guardianEmail,
      childName: body.name,
      grade: body.gradeLabel,
      academicYearId: resolvedYear,
    }, dedupConfig)
    assertNotDuplicate(dedup, { force: body.force })
    const identity = await dedupFields(db, {
      orgId: user.orgId, phone: body.guardianPhone, name: body.guardianName, email: body.guardianEmail,
    })

    // Code from numeric max, never count()+1 (counts undercount after soft
    // deletes and collide on the unique constraint). STU- prefix matches the
    // convert-from-admission and bulk-import paths.
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

    const student = await db.student.create({
      data: {
        orgId: user.orgId,
        studentCode,
        name: body.name,
        guardianName: body.guardianName ?? null,
        guardianPhone: body.guardianPhone ?? null,
        guardianEmail: body.guardianEmail ?? null,
        phoneNormalized: identity.phoneNormalized,
        householdId: identity.householdId,
        gradeLabel: body.gradeLabel ?? null,
        rollNumber: body.rollNumber ?? null,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : null,
        gender: body.gender
          ? (body.gender.toUpperCase() as Gender)
          : null,
        admissionId: body.admissionId ?? null,
        academicYearId: resolvedYear,
        status: (body.status ?? 'ACTIVE') as StudentStatus,
      }
    })

    return created({
      ...student,
      dedup: dedup.matches.length > 0 ? { action: dedup.action, matches: dedup.matches } : null
    })
  }
})
