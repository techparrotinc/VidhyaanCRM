import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { Gender, StudentStatus } from '@prisma/client'

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)
    const status = searchParams.get('status') ?? undefined
    const currentClass = searchParams.get('class') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status as StudentStatus
    if (currentClass) {
      where.gradeLabel = currentClass
    }
    if (academicYearId) {
      where.academicYearId = academicYearId
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search } },
        { studentCode: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { invoices: true }
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
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  currentClass: z.string().optional(),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  admissionId: z.string().optional(),
  academicYearId: z.string().optional()
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
    const count = await prisma.student.count({
      where: { orgId: user.orgId }
    })

    const studentCode = 'STU-' + year + '-' + String(count + 1).padStart(5, '0')

    const student = await db.student.create({
      data: {
        orgId: user.orgId,
        studentCode,
        name: body.name,
        guardianPhone: body.phone ?? null,
        guardianEmail: body.email ?? null,
        gradeLabel: body.currentClass ?? null,
        rollNumber: body.rollNumber ?? null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender ? (body.gender.toUpperCase() as Gender) : null,
        admissionId: body.admissionId ?? null,
        academicYearId: body.academicYearId ?? academicYearId ?? null,
        status: 'ACTIVE' as StudentStatus
      }
    })

    return created(student)
  }
})
