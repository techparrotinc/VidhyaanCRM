import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { toDbDate } from '@/lib/attendance/dates'
import {
  ensureNationalHolidays,
  groupHolidayRanges,
  istTodayString,
  daysBetween
} from '@/lib/holidays/national'

/**
 * Dashboard holiday announcement. Any authenticated org user; no module gate
 * (holidays matter beyond attendance). Lazily seeds national holidays for
 * orgs that have them enabled — this is the first API hit after login, so
 * existing orgs need no backfill.
 */
export const GET = route({
  handler: async ({ db, user }) => {
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true, institutionType: true }
    })
    if (org) {
      await ensureNationalHolidays(db, user.orgId, org.settings, org.institutionType)
    }

    const today = istTodayString()
    const rows = await db.holiday.findMany({
      where: { date: { gte: toDbDate(today) } },
      orderBy: { date: 'asc' },
      take: 20,
      select: { name: true, source: true, date: true }
    })

    const ranges = groupHolidayRanges(rows)
    const nearest = ranges[0]
    // Announce only when the holiday is current or near (Groww-style banner).
    const next =
      nearest && daysBetween(today, nearest.startDate) <= 30
        ? { ...nearest, daysUntil: Math.max(0, daysBetween(today, nearest.startDate)) }
        : null

    return ok({ today, next, upcoming: ranges.slice(0, 6) })
  }
})
