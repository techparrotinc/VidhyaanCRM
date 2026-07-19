import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery } from '@/lib/api/query'
import { DATE_RE, toDbDate, dbDateToString } from '@/lib/attendance/dates'

/**
 * Holiday calendar range read for the dashboard widget. Any authenticated
 * org user (viewing the holiday calendar is not an admin capability and not
 * attendance-module-gated). Writes stay on /settings/attendance/holidays.
 */
export const GET = route({
  handler: async ({ req, db }) => {
    const q = parseQuery(req.url, {
      from: z.string().regex(DATE_RE),
      to: z.string().regex(DATE_RE)
    })
    const holidays = await db.holiday.findMany({
      where: { date: { gte: toDbDate(q.from), lte: toDbDate(q.to) } },
      orderBy: { date: 'asc' },
      take: 200,
      select: { name: true, source: true, message: true, date: true }
    })
    return ok({
      holidays: holidays.map(h => ({ ...h, date: dbDateToString(h.date) }))
    })
  }
})
