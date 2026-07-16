import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { nextInvoiceNumber } from '@/lib/invoice-number'

const enrollSchema = z.object({
  courseId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional()
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Student')
    }

    const student = await db.student.findFirst({
      where: { id, orgId: user.orgId }
    })
    if (!student) {
      throw Errors.notFound('Student')
    }

    const enrollments = await db.courseEnrollment.findMany({
      where: { studentId: id, orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            amount: true,
            frequency: true,
            billingDay: true,
            category: true
          }
        }
      }
    })

    return ok(enrollments)
  }
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, params, academicYearId }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Student')
    }
    const body = enrollSchema.parse(await req.json())

    const student = await db.student.findFirst({
      where: { id, orgId: user.orgId }
    })
    if (!student) {
      throw Errors.notFound('Student')
    }

    const course = await db.course.findFirst({
      where: {
        id: body.courseId,
        orgId: user.orgId,
        deletedAt: null
      }
    })
    if (!course) {
      throw Errors.notFound('Course')
    }

    // Check not already enrolled
    const existing = await db.courseEnrollment.findFirst({
      where: {
        studentId: id,
        courseId: body.courseId,
        orgId: user.orgId,
        status: 'ACTIVE'
      }
    })
    if (existing) {
      throw Errors.conflict('Student is already enrolled in this course')
    }

    // Calculate next billing date
    const startDate = new Date(body.startDate)
    const today = new Date()
    const billingDay = course.billingDay

    let nextBillingDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      billingDay
    )
    if (nextBillingDate <= today) {
      nextBillingDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        billingDay
      )
    }

    // Create enrollment
    const enrollment = await db.courseEnrollment.create({
      data: {
        studentId: id,
        courseId: body.courseId,
        orgId: user.orgId,
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: 'ACTIVE',
        nextBillingDate
      },
      include: {
        course: true
      }
    })

    // Auto-generate first invoice immediately on enrollment. Numeric-max
    // numbering — count()+1 collides with the [orgId, invoiceNumber]
    // unique after soft deletes (this exact 500 hit the mobile enrol flow).
    const invoiceNumber = await nextInvoiceNumber(prisma, user.orgId)

    await db.invoice.create({
      data: {
        invoiceNumber,
        studentId: id,
        courseId: body.courseId,
        invoiceType: 'COURSE',
        academicYearId: academicYearId ?? null,
        orgId: user.orgId,
        totalAmount: course.amount,
        paidAmount: 0,
        lateFeeAmount: 0,
        status: 'UNPAID',
        dueDate: nextBillingDate,
        notes: `Auto-generated on enrollment: ${course.name}`,
        items: {
          create: [
            {
              head: course.name,
              amount: Number(course.amount),
              quantity: 1,
              orgId: user.orgId
            }
          ]
        }
      }
    })

    return created(enrollment)
  }
})
