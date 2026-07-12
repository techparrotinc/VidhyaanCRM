import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { parseQuery } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { MONTH_RE, monthRange, dbDateToString } from '@/lib/attendance/dates'
import { computeStats } from '@/lib/attendance/stats'

/** One student's month of attendance + summary stats (student-record tab). */
export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.TEACHER,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, params }) => {
    const studentId = (await params)?.id
    const q = parseQuery(req.url, {
      month: z.string().regex(MONTH_RE, 'Expected YYYY-MM')
    })

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true }
    })
    if (!student) throw Errors.notFound('Student')

    const { from, to } = monthRange(q.month)
    const records = await db.attendanceRecord.findMany({
      where: { studentId, date: { gte: from, lt: to } },
      select: {
        id: true, date: true, sessionId: true, status: true, source: true,
        note: true, checkInAt: true, checkOutAt: true,
        session: {
          select: {
            title: true,
            course: { select: { name: true } },
            batch: { select: { name: true } }
          }
        }
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
    })

    return ok({
      records: records.map(r => ({ ...r, date: dbDateToString(r.date) })),
      stats: computeStats(records.map(r => r.status))
    })
  }
})
