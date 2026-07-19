import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { Gender, StudentStatus } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { parseQuery, paginationShape, enumParam, dateParam, istRange } from '@/lib/api/query'
import { getGradeLabel } from '@/constants/grades'
import { assertFreeTierLimit } from '@/lib/billing/limits'
import { findMatches, loadDedupConfig, dedupFields, lockDedupPhone } from '@/lib/dedup'
import { assertNotDuplicate } from '@/lib/dedup/guard'
import { checkEmailDeliverable } from '@/lib/email/validate'
import { cleanPhoneNumber } from '@/lib/utils'

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST,
    ROLES.TEACHER,
    // Accountant's mobile Students tab is a read-only directory (fee
    // context: "whose invoice is this") — list access matches that.
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const { page, limit, status, createdFrom, createdTo } = parseQuery(req.url, {
      ...paginationShape,
      status: enumParam(StudentStatus),
      createdFrom: dateParam,
      createdTo: dateParam
    })
    const rawGradeParam = searchParams.get('gradeLabel') ?? searchParams.get('grade') ?? undefined
    const gradeLabel = rawGradeParam ? getGradeLabel(rawGradeParam) : undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined
    const section = searchParams.get('section') ?? undefined
    const countOnly = searchParams.get('countOnly') === 'true'

    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }
    if (status) where.status = status
    const createdWindow = istRange(createdFrom, createdTo)
    if (createdWindow) where.createdAt = createdWindow
    if (gradeLabel) {
      where.gradeLabel = gradeLabel
    }
    if (courseId) {
      where.courseEnrollments = { some: { courseId, status: 'ACTIVE' } }
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
  section: z.string().max(50).optional(),
  batchId: z.string().optional(),
  rollNumber: z.string().optional(),
  guardianName: z.string().optional(),
  // Cleaned (strips spaces/dashes/+91/leading 0) but not regex-locked to
  // 10-digit-mobile — landlines/alt formats stay valid; only non-numeric
  // junk ("abc") becomes an empty string and gets rejected below. Mirrors
  // the same fix applied to admissions.
  guardianPhone: z.string().optional()
    .or(z.literal(''))
    .transform((v): string | undefined => (!v ? undefined : (cleanPhoneNumber(v) as string)))
    .refine(v => v == null || v.length > 0, {
      message: 'Enter a valid guardian phone number'
    }),
  guardianEmail: z.string().email()
    .optional()
    .or(z.literal(''))
    .transform(v => v || undefined),
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

    // Deliverability gate — bad addresses here become bounces later.
    if (body.guardianEmail) {
      const emailCheck = await checkEmailDeliverable(body.guardianEmail)
      if (!emailCheck.ok) throw Errors.businessRule(emailCheck.message)
    }

    await assertFreeTierLimit(user.orgId, 'STUDENT')

    const resolvedYear = body.academicYearId ?? academicYearId ?? null

    // Dedup check through create, inside one transaction holding a Postgres
    // advisory lock on org+phone — findMatches has no DB-level constraint
    // behind it, so without this two near-simultaneous requests with the
    // same phone could both pass a hard-match block before either commits.
    // Lock releases automatically at commit/rollback.
    const { student, dedup } = await db.$transaction(async (tx: any): Promise<{ student: any; dedup: any }> => {
      await lockDedupPhone(tx, user.orgId, body.guardianPhone)

      const dedupConfig = await loadDedupConfig(tx, user.orgId)
      const dedup = await findMatches(tx, {
        orgId: user.orgId,
        phone: body.guardianPhone,
        email: body.guardianEmail,
        childName: body.name,
        grade: body.gradeLabel,
        academicYearId: resolvedYear,
      }, dedupConfig)
      assertNotDuplicate(dedup, { force: body.force })
      const identity = await dedupFields(tx, {
        orgId: user.orgId, phone: body.guardianPhone, name: body.guardianName, email: body.guardianEmail,
      })

      // Code from numeric max, never count()+1 (counts undercount after soft
      // deletes and collide on the unique constraint). STU- prefix matches
      // the convert-from-admission and bulk-import paths.
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

      const student = await tx.student.create({
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
          section: body.section?.trim() || null,
          batchId: body.batchId ?? null,
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

      return { student, dedup }
    })

    return created({
      ...student,
      dedup: dedup.matches.length > 0 ? { action: dedup.action, matches: dedup.matches } : null
    })
  }
})
