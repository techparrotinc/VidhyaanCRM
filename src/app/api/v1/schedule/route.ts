import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { DATE_RE, WEEK_RE, dayRange, isoWeekRange, todayStr } from '@/lib/schedule/dates'
import { SCHEDULE_READ_ROLES, SCHEDULE_ADMIN_ROLES, teacherTargets, teacherSessionWhere } from '@/lib/schedule/access'

const sessionInclude = {
  course: { select: { id: true, name: true } },
  batch: { select: { id: true, name: true, _count: { select: { students: true } } } }
} as const

export const GET = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_READ_ROLES,
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      date: z.string().regex(DATE_RE).optional(),
      week: z.string().regex(WEEK_RE).optional(),
      teacherId: textParam,
      courseId: textParam,
      search: textParam,
      academicYearId: textParam
    })

    const range = q.week ? isoWeekRange(q.week) : dayRange(q.date ?? todayStr())

    const where: any = { startsAt: range }
    // Legacy (pre-year-scoping) sessions carry a null academicYearId — keep
    // them visible under every year, same convention as students/invoices.
    if (q.academicYearId) where.OR = [{ academicYearId: q.academicYearId }, { academicYearId: null }]
    if (q.courseId) where.courseId = q.courseId

    if (user.role === ROLES.TEACHER) {
      const targets = await teacherTargets(db, user.id)
      const teacherOr = [{ teacherId: user.id }, ...teacherSessionWhere(targets).OR]
      where.AND = [...(where.OR ? [{ OR: where.OR }] : []), { OR: teacherOr }]
      delete where.OR
    } else if (q.teacherId) {
      where.teacherId = q.teacherId
    }

    const sessions = await db.courseSession.findMany({
      where,
      include: sessionInclude,
      orderBy: { startsAt: 'asc' },
      take: 800
    })

    const attendanceSessionIds = sessions.map(s => s.attendanceSessionId).filter((v): v is string => !!v)
    const markedCounts = attendanceSessionIds.length
      ? await db.attendanceRecord.groupBy({
          by: ['sessionId'],
          where: { sessionId: { in: attendanceSessionIds } },
          _count: { id: true }
        })
      : []
    const markedBySessionId = new Map(markedCounts.map(m => [m.sessionId, m._count.id]))

    const teacherIds = [...new Set(sessions.map(s => s.teacherId).filter((v): v is string => !!v))]
    const teachers = teacherIds.length
      ? await db.user.findMany({ where: { id: { in: teacherIds } }, select: { id: true, name: true } })
      : []
    const teacherById = new Map(teachers.map(t => [t.id, t.name]))

    // Per-student (individual) sessions carry a studentId — resolve names so the
    // card can lead with the student, which is what a busy LC front desk needs.
    const studentIds = [...new Set(sessions.map(s => (s as any).studentId).filter((v): v is string => !!v))]
    const students = studentIds.length
      ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } })
      : []
    const studentById = new Map(students.map(s => [s.id, s.name]))

    const canManage = SCHEDULE_ADMIN_ROLES.includes(user.role)
    let mapped = sessions.map(s => {
      const studentId = (s as any).studentId as string | null
      return {
        id: s.id,
        startsAt: s.startsAt,
        durationMin: s.durationMin,
        status: s.status,
        meetingLink: s.meetingLink,
        cancelReason: s.cancelReason,
        rescheduledFromId: s.rescheduledFromId,
        attendanceSessionId: s.attendanceSessionId,
        course: s.course,
        batch: s.batch ? { id: s.batch.id, name: s.batch.name, enrolledCount: s.batch._count.students } : null,
        student: studentId ? { id: studentId, name: studentById.get(studentId) ?? null } : null,
        // School timetable period sessions carry class scope + subject.
        subject: (s as any).subject as string | null,
        gradeLabel: (s as any).gradeLabel as string | null,
        section: (s as any).section as string | null,
        teacher: s.teacherId ? { id: s.teacherId, name: teacherById.get(s.teacherId) ?? null } : null,
        markedCount: s.attendanceSessionId ? markedBySessionId.get(s.attendanceSessionId) ?? 0 : null,
        canManage
      }
    })

    // Free-text search across student, course and group name (post-resolve so
    // the student name is searchable). Cheap over the capped result set.
    if (q.search) {
      const needle = q.search.toLowerCase()
      mapped = mapped.filter(
        m =>
          m.student?.name?.toLowerCase().includes(needle) ||
          m.course?.name?.toLowerCase().includes(needle) ||
          m.batch?.name?.toLowerCase().includes(needle) ||
          m.subject?.toLowerCase().includes(needle) ||
          m.gradeLabel?.toLowerCase().includes(needle)
      )
    }

    // Facets for the filter bar (course + teaching staff). Stable lists, not
    // just what's in range, so the dropdowns don't jump around by date.
    const [courseFacet, taRows] = await Promise.all([
      db.course.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      db.teacherAssignment.findMany({ select: { teacherId: true } })
    ])
    const facetTeacherIds = [...new Set(taRows.map(r => r.teacherId))]
    const teacherFacet = facetTeacherIds.length
      ? await db.user.findMany({
          where: { id: { in: facetTeacherIds } },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        })
      : []

    return ok({ sessions: mapped, range, facets: { courses: courseFacet, teachers: teacherFacet } })
  }
})
