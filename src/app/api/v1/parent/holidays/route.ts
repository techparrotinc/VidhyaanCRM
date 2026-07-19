import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { toDbDate } from '@/lib/attendance/dates'
import {
  groupHolidayRanges,
  istTodayString,
  daysBetween,
  nationalHolidayList,
  HOLIDAY_SOURCE,
  resolveHolidaySettings,
  DEFAULT_GREETING_LEAD_DAYS
} from '@/lib/holidays/national'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Holidays for the parent portal, across the organisations the parent's wards
 * are enrolled in. Two modes:
 *  - default: announcement payload (nearest holiday + upcoming list)
 *  - ?from=YYYY-MM-DD&to=YYYY-MM-DD: flat calendar rows for the month widget
 * Read-only: national-holiday seeding happens on the org side.
 */
export async function GET(req: Request) {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const rangeMode = !!(from && DATE_RE.test(from) && to && DATE_RE.test(to))

    // ALUMNI included deliberately: a parent whose ward just graduated is
    // still linked to the org and should keep seeing its holiday calendar.
    const wards = await prisma.student.findMany({
      where: { ...linkedStudentsWhere(parent), status: { in: ['ACTIVE', 'ALUMNI'] } },
      select: {
        orgId: true,
        organization: { select: { name: true, settings: true, institutionType: true } }
      },
      distinct: ['orgId']
    })
    if (wards.length === 0) {
      return NextResponse.json({ success: true, next: null, upcoming: [], holidays: [] })
    }

    const orgNames = new Map(wards.map(w => [w.orgId, w.organization.name]))
    const orgGreeting = new Map(
      wards.map(w => [
        w.orgId,
        resolveHolidaySettings(w.organization.settings, w.organization.institutionType)
      ])
    )
    const multiOrgCal = orgNames.size > 1
    const today = istTodayString()

    if (rangeMode) {
      const cal = await prisma.holiday.findMany({
        where: {
          orgId: { in: [...orgNames.keys()] },
          date: { gte: toDbDate(from!), lte: toDbDate(to!) }
        },
        orderBy: { date: 'asc' },
        take: 200,
        select: { orgId: true, name: true, source: true, message: true, date: true }
      })
      const calRows = cal.map(h => ({
        name: h.name,
        source: h.source,
        message: h.message,
        date: h.date.toISOString().slice(0, 10),
        orgName: multiOrgCal ? orgNames.get(h.orgId) ?? null : null
      }))
      // Parents always see national holidays, even when the ward's org has
      // not enabled them — they are public holidays either way.
      const occupied = new Set(calRows.map(r => r.date))
      const fromYear = Number(from!.slice(0, 4))
      const toYear = Number(to!.slice(0, 4))
      const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)
      const nationals = nationalHolidayList(years)
        .filter(n => n.date >= from! && n.date <= to! && !occupied.has(n.date))
        .map(n => ({ ...n, source: HOLIDAY_SOURCE.NATIONAL, message: null, orgName: null }))
      return NextResponse.json({
        success: true,
        holidays: [...calRows, ...nationals].sort((a, b) => a.date.localeCompare(b.date))
      })
    }

    const rows = await prisma.holiday.findMany({
      where: { orgId: { in: [...orgNames.keys()] }, date: { gte: toDbDate(today) } },
      orderBy: { date: 'asc' },
      take: 40,
      select: { orgId: true, name: true, source: true, message: true, date: true }
    })

    // Group per org so a 3-day break at one school merges cleanly, then
    // interleave by start date. Org name shown only when parent spans orgs.
    const multiOrg = orgNames.size > 1
    const ranges = [...orgNames.keys()]
      .flatMap(orgId =>
        groupHolidayRanges(rows.filter(r => r.orgId === orgId)).map(r => ({
          ...r,
          orgId: orgId as string | null,
          orgName: multiOrg ? orgNames.get(orgId) ?? null : null
        }))
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))

    // National-holiday fallback: parents get the greeting even when the
    // ward's org keeps no holiday rows (e.g. national toggle off).
    const currentYear = Number(today.slice(0, 4))
    const covered = (d: string) => ranges.some(r => r.startDate <= d && d <= r.endDate)
    const nationals = nationalHolidayList([currentYear, currentYear + 1])
      .filter(n => n.date >= today && !covered(n.date))
      .map(n => ({
        name: n.name,
        source: HOLIDAY_SOURCE.NATIONAL,
        message: null as string | null,
        startDate: n.date,
        endDate: n.date,
        orgId: null as string | null,
        orgName: null as string | null
      }))
    const merged = [...ranges, ...nationals].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    )

    // Greeting window follows each org's setting (default 7 days); the
    // national fallback uses the platform default. Orgs that turned the
    // greeting off never trigger it, but national days still can.
    const nearest = merged.find(r => {
      const d = daysBetween(today, r.startDate)
      if (d < 0) return false
      if (!r.orgId) return d <= DEFAULT_GREETING_LEAD_DAYS
      const cfg = orgGreeting.get(r.orgId)
      return !!cfg && cfg.greetingEnabled && d <= cfg.greetingLeadDays
    })
    const next = nearest
      ? { ...nearest, daysUntil: Math.max(0, daysBetween(today, nearest.startDate)) }
      : null

    return NextResponse.json({ success: true, today, next, upcoming: merged.slice(0, 6) })
  } catch (err) {
    console.error('parent holidays:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load holidays' },
      { status: 500 }
    )
  }
}
