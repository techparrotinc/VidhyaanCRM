import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
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
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params }) => {
    const id = params?.id
    const student = await db.student.findFirst({
      where: { id }
    })

    if (!student) {
      throw Errors.notFound('Student')
    }

    const [invoices, totalInvoices] = await Promise.all([
      db.invoice.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      db.invoice.count({
        where: { studentId: id }
      })
    ])

    return ok({
      ...student,
      invoices,
      _count: {
        invoices: totalInvoices
      }
    })
  }
})

export const PUT = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, params }) => {
    const body = await req.json()

    const existing = await db.student.findFirst({
      where: { id: params?.id }
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
    if (body.admissionId !== undefined) updateData.admissionId = body.admissionId
    if (body.batchId !== undefined) updateData.batchId = body.batchId

    const updated = await db.student.update({
      where: { id: params?.id },
      data: updateData
    })

    return ok(updated)
  }
})
