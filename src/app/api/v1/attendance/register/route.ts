import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { parseQuery, textParam } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { AttendanceStatus } from '@prisma/client'
import { DATE_RE, toDbDate, isWorkingDay } from '@/lib/attendance/dates'
import { istDateString } from '@/lib/reports/rollup'
import { prisma } from '@/lib/db/client'
import { resolveAttendanceSettings } from '@/lib/attendance/settings'
import { assertCanMark, getTeacherAssignments, ATTENDANCE_ADMIN_ROLES } from '@/lib/attendance/access'
import { sendAbsenceAlerts } from '@/lib/attendance/alerts'

const MARK_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER]

const dateParam = z.string().regex(DATE_RE, 'Expected YYYY-MM-DD')

/** Roster + existing marks for one register (grade+section day, or session). */
export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: MARK_ROLES,
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      date: dateParam,
      gradeLabel: textParam,
      section: textParam,
      /** 'true' = roster restricted to students with NO section set. */
      unsectioned: textParam,
      sessionId: textParam
    })
    if (!q.gradeLabel && !q.sessionId) {
      throw Errors.validation({ gradeLabel: ['Provide gradeLabel (school) or sessionId (sessions)'] })
    }

    const date = toDbDate(q.date)
    let sessionKey = 'DAY'
    let roster: { id: string; name: string; studentCode: string; rollNumber: string | null; section: string | null }[]

    if (q.sessionId) {
      const session = await db.attendanceSession.findUnique({ where: { id: q.sessionId } })
      if (!session) throw Errors.notFound('Session')
      sessionKey = session.id
      const select = { id: true, name: true, studentCode: true, rollNumber: true, section: true }
      if (session.gradeLabel) {
        // School timetable period → the class/section roster (section null = whole class).
        await assertCanMark(db, user, { gradeLabel: session.gradeLabel, section: session.section ?? undefined })
        roster = await db.student.findMany({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
            gradeLabel: { equals: session.gradeLabel, mode: 'insensitive' },
            ...(session.section ? { section: { equals: session.section, mode: 'insensitive' } } : {})
          },
          select,
          orderBy: [{ rollNumber: 'asc' }, { name: 'asc' }]
        })
      } else {
        await assertCanMark(db, user, { courseId: session.courseId, batchId: session.batchId })
        roster = session.courseId
          ? (
              await db.courseEnrollment.findMany({
                where: { courseId: session.courseId, status: 'ACTIVE', student: { deletedAt: null, status: 'ACTIVE' } },
                select: { student: { select } }
              })
            ).map(e => e.student)
          : await db.student.findMany({
              where: { batchId: session.batchId, deletedAt: null, status: 'ACTIVE' },
              select,
              orderBy: { name: 'asc' }
            })
      }
    } else {
      await assertCanMark(db, user, { gradeLabel: q.gradeLabel, section: q.section })
      roster = await db.student.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          gradeLabel: { equals: q.gradeLabel, mode: 'insensitive' },
          ...(q.section
            ? { section: { equals: q.section, mode: 'insensitive' } }
            : q.unsectioned === 'true'
              ? { section: null }
              : {})
        },
        select: { id: true, name: true, studentCode: true, rollNumber: true, section: true },
        orderBy: [{ rollNumber: 'asc' }, { name: 'asc' }]
      })
    }

    const [org, holiday, marks] = await Promise.all([
      db.organization.findUnique({ where: { id: user.orgId }, select: { settings: true } }),
      db.holiday.findFirst({ where: { date } }),
      db.attendanceRecord.findMany({
        where: { date, sessionKey, studentId: { in: roster.map(s => s.id) } },
        select: {
          studentId: true, status: true, note: true, source: true,
          checkInAt: true, updatedAt: true,
          markedBy: { select: { name: true } }
        }
      })
    ])
    const settings = resolveAttendanceSettings(org?.settings)

    return ok({
      roster,
      marks,
      holiday: holiday ? { name: holiday.name } : null,
      isWorkingDay: isWorkingDay(q.date, settings.workingDays)
    })
  }
})

const saveSchema = z.object({
  date: dateParam,
  sessionId: z.string().optional(),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.nativeEnum(AttendanceStatus),
        note: z.string().max(500).optional()
      })
    )
    .min(1)
    .max(500)
})

/** Save a register: transactional upserts on (org, student, date, sessionKey). */
export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: MARK_ROLES,
  handler: async ({ req, db, user, academicYearId }) => {
    const body = saveSchema.parse(await req.json())
    if (body.date > istDateString()) {
      throw Errors.validation({ date: ['Cannot mark attendance for a future date'] })
    }
    const date = toDbDate(body.date)
    const sessionKey = body.sessionId ?? 'DAY'

    if (body.sessionId) {
      const session = await db.attendanceSession.findUnique({ where: { id: body.sessionId } })
      if (!session) throw Errors.notFound('Session')
      if (session.gradeLabel) {
        await assertCanMark(db, user, { gradeLabel: session.gradeLabel, section: session.section ?? undefined })
      } else {
        await assertCanMark(db, user, { courseId: session.courseId, batchId: session.batchId })
      }
    } else if (!ATTENDANCE_ADMIN_ROLES.includes(user.role)) {
      // Daily marks: teacher must be assigned to every student's grade+section.
      const students = await db.student.findMany({
        where: { id: { in: body.entries.map(e => e.studentId) }, deletedAt: null },
        select: { gradeLabel: true, section: true }
      })
      for (const s of students) {
        await assertCanMark(db, user, { gradeLabel: s.gradeLabel, section: s.section })
      }
    }

    // Guard against marking students of another org (ids come from the client).
    const validIds = new Set(
      (
        await db.student.findMany({
          where: { id: { in: body.entries.map(e => e.studentId) }, deletedAt: null },
          select: { id: true }
        })
      ).map(s => s.id)
    )
    const entries = body.entries.filter(e => validIds.has(e.studentId))

    // Pre-fetch existing marks so a genuine correction (status actually
    // changing on an already-marked record) can be audit-logged after the
    // save — corrections previously overwrote silently with no history.
    const existing = await db.attendanceRecord.findMany({
      where: { orgId: user.orgId, date, sessionKey, studentId: { in: entries.map(e => e.studentId) } },
      select: { studentId: true, status: true }
    })
    const existingByStudent = new Map(existing.map(r => [r.studentId, r.status]))

    const saved = await db.$transaction(
      entries.map(e =>
        db.attendanceRecord.upsert({
          where: {
            orgId_studentId_date_sessionKey: {
              orgId: user.orgId,
              studentId: e.studentId,
              date,
              sessionKey
            }
          },
          create: {
            orgId: user.orgId,
            studentId: e.studentId,
            date,
            sessionId: body.sessionId ?? null,
            sessionKey,
            status: e.status,
            note: e.note,
            academicYearId,
            markedById: user.id
          },
          update: {
            status: e.status,
            note: e.note ?? null,
            updatedById: user.id,
            // A manual save always claims the record as manually-sourced —
            // otherwise a correction to a BIOMETRIC-sourced record left the
            // source unchanged, so a later biometric punch could silently
            // re-overwrite the teacher's correction (biometric ingest only
            // skips records already sourced MANUAL/API).
            source: 'MANUAL'
          }
        })
      )
    )

    // Fire-and-forget: audit trail for corrections (status changed on an
    // already-marked record) — attendance is compliance-sensitive and the
    // upsert has no other history; skips fresh first-time marks.
    const corrections = entries
      .filter(e => existingByStudent.has(e.studentId) && existingByStudent.get(e.studentId) !== e.status)
      .map(e => ({
        orgId: user.orgId,
        userId: user.id,
        action: 'UPDATE' as const,
        entityType: 'ATTENDANCE_RECORD',
        entityId: e.studentId,
        before: { date: body.date, sessionKey, status: existingByStudent.get(e.studentId) },
        after: { date: body.date, sessionKey, status: e.status }
      }))
    if (corrections.length) {
      prisma.auditLog.createMany({ data: corrections }).catch(err => console.error('attendance correction audit failed:', err))
    }

    // Fire-and-forget: guardian alerts for records now ABSENT (today only).
    sendAbsenceAlerts(user.orgId, body.date, saved.filter(r => r.status === 'ABSENT').map(r => r.id))
      .catch(err => console.error('absence alerts failed:', err))

    return ok({ saved: saved.length })
  }
})
