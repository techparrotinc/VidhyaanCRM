import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'
import { materializeBatch, materializeEnrollment, defaultTeacherId } from '@/lib/schedule/materialize'

// Daily: rolls every active batch's recurring pattern ~2 weeks ahead into
// CourseSession rows. Idempotent (materializeBatch never touches an
// already-materialized slot), so re-running after a partial failure is safe.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgIds = (
    await prisma.organizationModule.findMany({
      where: { enabled: true, module: { slug: MODULES.COURSE_SCHEDULE } },
      select: { orgId: true }
    })
  ).map(r => r.orgId)
  if (orgIds.length === 0) return NextResponse.json({ ok: true, batches: 0, created: 0 })

  const batches = await prisma.studentBatch.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      isActive: true,
      startTime: { not: null }
    }
  })

  let created = 0
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

  return NextResponse.json({
    ok: true,
    batches: batches.length,
    enrollments: enrollmentsDone,
    created
  })
}
