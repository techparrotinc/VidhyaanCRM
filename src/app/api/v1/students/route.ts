import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { Gender, StudentStatus } from '@prisma/client'
import { parseQuery, paginationShape, enumParam } from '@/lib/api/query'

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
    const GRADE_LABEL_MAP: Record<string, string> = {
      'pre_kg': 'Pre-KG',
      'nursery': 'Nursery',
      'lkg': 'LKG',
      'ukg': 'UKG',
      'class_1': 'Class 1',
      'class_2': 'Class 2',
      'class_3': 'Class 3',
      'class_4': 'Class 4',
      'class_5': 'Class 5',
      'class_6': 'Class 6',
      'class_7': 'Class 7',
      'class_8': 'Class 8',
      'class_9': 'Class 9',
      'class_10': 'Class 10',
      'class_11_science': 'Class 11 - Science',
      'class_11_commerce': 'Class 11 - Commerce',
      'class_11_arts': 'Class 11 - Arts',
      'class_12_science': 'Class 12 - Science',
      'class_12_commerce': 'Class 12 - Commerce',
      'class_12_arts': 'Class 12 - Arts',
      'other': 'Other',
    }
    const rawGradeParam = searchParams.get('gradeLabel') ?? searchParams.get('grade') ?? undefined
    const gradeLabel = rawGradeParam
      ? (GRADE_LABEL_MAP[rawGradeParam] ?? rawGradeParam)
      : undefined
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
  notes: z.string().optional()
})

export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const body = createStudentSchema.parse(await req.json())

    const year = new Date().getFullYear()
    const count = await db.student.count()

    const studentCode = 'ST-' + year + '-' + String(count + 1).padStart(5, '0')

    const student = await db.student.create({
      data: {
        orgId: user.orgId,
        studentCode,
        name: body.name,
        guardianName: body.guardianName ?? null,
        guardianPhone: body.guardianPhone ?? null,
        guardianEmail: body.guardianEmail ?? null,
        gradeLabel: body.gradeLabel ?? null,
        rollNumber: body.rollNumber ?? null,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : null,
        gender: body.gender
          ? (body.gender.toUpperCase() as Gender)
          : null,
        admissionId: body.admissionId ?? null,
        academicYearId: body.academicYearId
          ?? academicYearId ?? null,
        status: (body.status ?? 'ACTIVE') as StudentStatus,
      }
    })

    return created(student)
  }
})
