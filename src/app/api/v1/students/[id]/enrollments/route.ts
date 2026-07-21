import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { nextInvoiceNumber } from '@/lib/invoice-number'
import { HHMM } from '@/lib/timetable'
import { materializeEnrollment } from '@/lib/schedule/materialize'
import { assertNoStudentScheduleConflict } from '@/lib/schedule/conflicts'

// Optional per-student custom weekly schedule. When present, the student gets
// their own EnrollmentScheduleSlot rows (individual sessions) — mutually
// exclusive with joining a batch (a batched student inherits the cohort's
// shared sessions instead).
const scheduleSlotSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    startTime: z.string().regex(HHMM, 'Expected HH:mm'),
    endTime: z.string().regex(HHMM, 'Expected HH:mm'),
    durationMin: z.coerce.number().int().positive().optional(),
    teacherId: z.string().trim().optional().nullable(),
    room: z.string().trim().max(60).optional().nullable()
  })
  .refine(s => s.endTime > s.startTime, {
    message: 'End time must be after start time',
    path: ['endTime']
  })

const enrollSchema = z.object({
  courseId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  schedule: z
    .object({
      slots: z.array(scheduleSlotSchema).min(1).max(14),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    })
    .optional()
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

    // Per-student custom schedule (optional). A batched student uses the cohort
    // schedule instead, so reject mixing the two.
    let sessionsCreated = 0
    if (body.schedule) {
      if (student.batchId) {
        throw Errors.conflict(
          'This student is in a batch and follows its schedule. Remove them from the batch to set a custom schedule.'
        )
      }
      await assertNoStudentScheduleConflict(db, {
        studentId: id,
        enrollmentId: enrollment.id,
        slots: body.schedule.slots
      })
      const slotStart = body.schedule.startDate ? new Date(body.schedule.startDate) : null
      const slotEnd = body.schedule.endDate ? new Date(body.schedule.endDate) : null

      await db.enrollmentScheduleSlot.createMany({
        data: body.schedule.slots.map(s => ({
          orgId: user.orgId,
          enrollmentId: enrollment.id,
          studentId: id,
          courseId: body.courseId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          durationMin: s.durationMin ?? null,
          teacherId: s.teacherId || null,
          room: s.room || null,
          startDate: slotStart,
          endDate: slotEnd
        }))
      })

      const slots = await db.enrollmentScheduleSlot.findMany({
        where: { enrollmentId: enrollment.id, deletedAt: null }
      })
      sessionsCreated = await materializeEnrollment(
        db,
        {
          id: enrollment.id,
          orgId: user.orgId,
          branchId: student.branchId ?? null,
          academicYearId: student.academicYearId ?? null,
          courseId: body.courseId,
          studentId: id,
          totalHours: course.totalHours ?? null
        },
        slots.map(r => ({
          id: r.id,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          durationMin: r.durationMin,
          teacherId: r.teacherId,
          startDate: r.startDate,
          endDate: r.endDate,
          isActive: r.isActive
        }))
      )
    }

    return created({ ...enrollment, sessionsCreated })
  }
})
