import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'
import {
  materializeBatch,
  materializeEnrollment,
  materializeTimetableSlot,
  defaultTeacherId,
  MATERIALIZE_HORIZON_DAYS
} from '@/lib/schedule/materialize'

// Daily: rolls recurring patterns ~2 weeks ahead into CourseSession +
// AttendanceSession rows — LC batches/enrolments (course_schedule orgs) and
// school class timetables (any org with timetable slots). Idempotent per
// source, so re-running after a partial failure is safe.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let created = 0

  const orgIds = (
    await prisma.organizationModule.findMany({
      where: { enabled: true, module: { slug: MODULES.COURSE_SCHEDULE } },
      select: { orgId: true }
    })
  ).map(r => r.orgId)

  const batches = orgIds.length
    ? await prisma.studentBatch.findMany({
        where: { orgId: { in: orgIds }, deletedAt: null, isActive: true, startTime: { not: null } }
      })
    : []

  for (const batch of batches) {
    if (batch.daysOfWeek.length === 0) continue
    const teacherId = await defaultTeacherId(prisma, batch)
    created += await materializeBatch(prisma, batch, { teacherId }).catch(err => {
      console.error('Schedule materialize (cron):', batch.id, err)
      return 0
    })
  }

  // Per-student custom schedules: every active enrolment that carries schedule
  // slots. Grouped by enrolment so the course hours budget is shared correctly.
  const slots = await prisma.enrollmentScheduleSlot.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      isActive: true,
      enrollment: { status: 'ACTIVE' }
    },
    include: {
      enrollment: {
        select: {
          id: true,
          orgId: true,
          courseId: true,
          studentId: true,
          student: { select: { branchId: true, academicYearId: true } },
          course: { select: { totalHours: true } }
        }
      }
    }
  })

  const byEnrollment = new Map<string, typeof slots>()
  for (const s of slots) {
    const arr = byEnrollment.get(s.enrollmentId) ?? []
    arr.push(s)
    byEnrollment.set(s.enrollmentId, arr)
  }

  let enrollmentsDone = 0
  for (const [enrollmentId, rows] of byEnrollment) {
    const e = rows[0].enrollment
    enrollmentsDone++
    created += await materializeEnrollment(
      prisma,
      {
        id: e.id,
        orgId: e.orgId,
        branchId: e.student.branchId,
        academicYearId: e.student.academicYearId,
        courseId: e.courseId,
        studentId: e.studentId,
        totalHours: e.course?.totalHours ?? null
      },
      rows.map(r => ({
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
    ).catch(err => {
      console.error('Schedule materialize enrolment (cron):', enrollmentId, err)
      return 0
    })
  }

  // School class timetables → period sessions (any org with active slots, not
  // gated on the LC module). Skip one-off cancellations (TimetableException)
  // and holidays for the target date.
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(windowStart)
  windowEnd.setDate(windowEnd.getDate() + MATERIALIZE_HORIZON_DAYS + 1)

  const timetableSlots = await prisma.timetableSlot.findMany({
    where: { cancelledAt: null }
  })

  let timetableSessions = 0
  if (timetableSlots.length > 0) {
    const slotIds = timetableSlots.map(s => s.id)
    const orgIdSet = [...new Set(timetableSlots.map(s => s.orgId))]

    const [exceptions, holidays] = await Promise.all([
      prisma.timetableException.findMany({
        where: { slotId: { in: slotIds }, date: { gte: windowStart, lt: windowEnd } },
        select: { slotId: true, date: true }
      }),
      prisma.holiday.findMany({
        where: { orgId: { in: orgIdSet }, date: { gte: windowStart, lt: windowEnd } },
        select: { orgId: true, date: true }
      })
    ])
    const exBySlot = new Map<string, Set<string>>()
    for (const e of exceptions) {
      const set = exBySlot.get(e.slotId) ?? new Set<string>()
      set.add(e.date.toISOString().slice(0, 10))
      exBySlot.set(e.slotId, set)
    }
    const holByOrg = new Map<string, Set<string>>()
    for (const h of holidays) {
      const set = holByOrg.get(h.orgId) ?? new Set<string>()
      set.add(h.date.toISOString().slice(0, 10))
      holByOrg.set(h.orgId, set)
    }

    for (const slot of timetableSlots) {
      timetableSessions += await materializeTimetableSlot(
        prisma,
        {
          id: slot.id,
          orgId: slot.orgId,
          branchId: slot.branchId,
          academicYearId: slot.academicYearId,
          gradeLabel: slot.gradeLabel,
          section: slot.section,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          teacherId: slot.teacherId
        },
        {
          cancelledDates: exBySlot.get(slot.id),
          holidays: holByOrg.get(slot.orgId)
        }
      ).catch(err => {
        console.error('Timetable materialize (cron):', slot.id, err)
        return 0
      })
    }
  }
  created += timetableSessions

  return NextResponse.json({
    ok: true,
    batches: batches.length,
    enrollments: enrollmentsDone,
    timetableSlots: timetableSlots.length,
    timetableSessions,
    created
  })
}
