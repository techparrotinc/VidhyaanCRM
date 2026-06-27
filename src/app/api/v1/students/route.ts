import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { Gender, StudentStatus } from '@prisma/client'

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

    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 25)
    const status = searchParams.get('status') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status as StudentStatus
    if (gradeLabel) {
      where.gradeLabel = gradeLabel
    }
    if (academicYearId) {
      where.academicYearId = academicYearId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentCode: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search, mode: 'insensitive' } }
      ]
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
