import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { HHMM } from '@/lib/timetable'
import { materializeEnrollment } from '@/lib/schedule/materialize'
import { assertNoStudentScheduleConflict } from '@/lib/schedule/conflicts'

// Scheduling is a COURSE_SCHEDULE concern, NOT billing — LC orgs commonly run
// course_schedule without fee_management, so this must never gate on
// FEE_MANAGEMENT (that lock is why the "not enrolled" message fired).
const SCHEDULE_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.ACCOUNTANT]

// The student's active enrolments + current schedule state, for the modal.
export const GET = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_ROLES,
  handler: async ({ db, user, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Student')
    const student = await db.student.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      select: { id: true, batchId: true }
    })
    if (!student) throw Errors.notFound('Student')

    const enrollments = await db.courseEnrollment.findMany({
      where: { studentId: id, orgId: user.orgId, status: 'ACTIVE' },
      select: {
        id: true,
        courseId: true,
        course: {
          select: { id: true, name: true, hoursPerWeek: true, totalHours: true }
        },
        scheduleSlots: {
          where: { deletedAt: null, isActive: true },
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true, durationMin: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return ok({ batchId: student.batchId, enrollments })
  }
})

// Set/replace a student's schedule for one enrolled course, straight from the
// student list. A student is EITHER in a group class (batch — shared sessions)
// OR on an individual per-student schedule — this endpoint switches between the
// two and (re)generates the per-student sessions. Billing is untouched; the
// student must already be enrolled in the course.

const slotSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    startTime: z.string().regex(HHMM, 'Expected HH:mm'),
    endTime: z.string().regex(HHMM, 'Expected HH:mm'),
    durationMin: z.coerce.number().int().positive().optional(),
    teacherId: z.string().trim().optional().nullable(),
    room: z.string().trim().max(60).optional().nullable()
  })
  .refine(s => s.endTime > s.startTime, { message: 'End time must be after start time', path: ['endTime'] })

const bodySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('batch'), courseId: z.string().min(1), batchId: z.string().min(1) }),
  z.object({
    mode: z.literal('custom'),
    courseId: z.string().min(1),
    slots: z.array(slotSchema).min(1).max(14),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
])

export const POST = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Student')
    const body = bodySchema.parse(await req.json())

    const student = await db.student.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      select: { id: true, branchId: true, academicYearId: true }
    })
    if (!student) throw Errors.notFound('Student')

    const enrollment = await db.courseEnrollment.findFirst({
      where: { studentId: id, courseId: body.courseId, orgId: user.orgId, status: 'ACTIVE' },
      select: { id: true, courseId: true, course: { select: { totalHours: true } } }
    })
    if (!enrollment) {
      throw Errors.notFound('Enrol the student in this course before setting a schedule')
    }

    // Wipe this enrollment's per-student slots and their FUTURE, unmarked
    // sessions before switching mode — so re-scheduling never leaves orphans.
    await clearIndividualSchedule(db, enrollment.id)

    if (body.mode === 'batch') {
      // Join a group class: batch sessions are shared, so nothing to materialize
      // per student — just point the student at the batch.
      const batch = await db.studentBatch.findFirst({
        where: { id: body.batchId, orgId: user.orgId, deletedAt: null },
        select: { id: true }
      })
      if (!batch) throw Errors.notFound('Group class')
      await db.student.update({ where: { id }, data: { batchId: body.batchId } })
      return ok({ mode: 'batch', sessionsCreated: 0 })
    }

    // Individual schedule: reject double-booking, then write + generate.
    await assertNoStudentScheduleConflict(db, { studentId: id, enrollmentId: enrollment.id, slots: body.slots })

    // Leave any group class, write the new slots, generate.
    await db.student.update({ where: { id }, data: { batchId: null } })

    const slotStart = body.startDate ? new Date(body.startDate) : null
    const slotEnd = body.endDate ? new Date(body.endDate) : null
    await db.enrollmentScheduleSlot.createMany({
      data: body.slots.map(s => ({
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
    const sessionsCreated = await materializeEnrollment(
      db,
      {
        id: enrollment.id,
        orgId: user.orgId,
        branchId: student.branchId ?? null,
        academicYearId: student.academicYearId ?? null,
        courseId: body.courseId,
        studentId: id,
        totalHours: enrollment.course?.totalHours ?? null
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

    return ok({ mode: 'custom', sessionsCreated })
  }
})

// Removes an enrollment's slots plus its future, still-scheduled, unmarked
// sessions (so a reschedule regenerates cleanly). Past/marked sessions stay as
// the attendance record of what already happened.
async function clearIndividualSchedule(db: any, enrollmentId: string) {
  const now = new Date()
  const future = await db.courseSession.findMany({
    where: {
      enrollmentId,
      startsAt: { gte: now },
      status: 'SCHEDULED',
      deletedAt: null
    },
    select: { id: true, attendanceSessionId: true }
  })
  const attIds = future.map((s: any) => s.attendanceSessionId).filter(Boolean)
  if (future.length > 0) {
    await db.courseSession.deleteMany({ where: { id: { in: future.map((s: any) => s.id) } } })
  }
  if (attIds.length > 0) {
    // Only remove attendance sessions with no marks — never destroy real data.
    await db.attendanceSession.deleteMany({
      where: { id: { in: attIds }, records: { none: {} } }
    })
  }
  await db.enrollmentScheduleSlot.deleteMany({ where: { enrollmentId } })
}
