import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { Gender, StudentStatus } from '@prisma/client'

const studentInclude = {
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
  },
  invoices: {
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      status: true,
      dueDate: true,
      createdAt: true
    }
  }
} as const

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params }) => {
    const id = params?.id
    const student = await db.student.findFirst({
      where: { id },
      include: studentInclude
    })

    if (!student) {
      throw Errors.notFound('Student')
    }

    return ok(student)
  }
})

const updateStudentSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  currentClass: z.string().optional(),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  status: z.enum(['ACTIVE', 'ALUMNI', 'TRANSFERRED', 'SUSPENDED', 'DROPPED_OUT']).optional(),
  academicYearId: z.string().optional(),
  batchId: z.string().optional(),
  guardianName: z.string().optional()
})

export const PUT = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, params }) => {
    const id = params?.id
    const body = updateStudentSchema.parse(await req.json())

    const existing = await db.student.findFirst({
      where: { id }
    })

    if (!existing) {
      throw Errors.notFound('Student')
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.guardianPhone = body.phone
    if (body.email !== undefined) updateData.guardianEmail = body.email
    if (body.currentClass !== undefined) updateData.gradeLabel = body.currentClass
    if (body.rollNumber !== undefined) updateData.rollNumber = body.rollNumber
    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
    }
    if (body.gender !== undefined) {
      updateData.gender = body.gender ? (body.gender.toUpperCase() as Gender) : null
    }
    if (body.status !== undefined) updateData.status = body.status as StudentStatus
    if (body.academicYearId !== undefined) updateData.academicYearId = body.academicYearId
    if (body.batchId !== undefined) updateData.batchId = body.batchId
    if (body.guardianName !== undefined) updateData.guardianName = body.guardianName

    const updated = await db.student.update({
      where: { id },
      data: updateData,
      include: studentInclude
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, params }) => {
    const id = params?.id
    const existing = await db.student.findFirst({
      where: { id }
    })

    if (!existing) {
      throw Errors.notFound('Student')
    }

    await db.student.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return ok({ success: true })
  }
})
