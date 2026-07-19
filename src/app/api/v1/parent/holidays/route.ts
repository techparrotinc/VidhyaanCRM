import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { toDbDate } from '@/lib/attendance/dates'
import {
  groupHolidayRanges,
  istTodayString,
  daysBetween
} from '@/lib/holidays/national'

/**
 * Holiday announcement for the parent portal — upcoming holidays across the
 * organisations the parent's wards are enrolled in (nearest first). Read-only:
 * national-holiday seeding happens on the org side.
 */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const wards = await prisma.student.findMany({
      where: { ...linkedStudentsWhere(parent), status: 'ACTIVE' },
      select: { orgId: true, organization: { select: { name: true } } },
      distinct: ['orgId']
    })
    if (wards.length === 0) {
      return NextResponse.json({ success: true, next: null, upcoming: [] })
    }

    const orgNames = new Map(wards.map(w => [w.orgId, w.organization.name]))
    const today = istTodayString()
    const rows = await prisma.holiday.findMany({
      where: { orgId: { in: [...orgNames.keys()] }, date: { gte: toDbDate(today) } },
      orderBy: { date: 'asc' },
      take: 40,
      select: { orgId: true, name: true, source: true, date: true }
    })

    // Group per org so a 3-day break at one school merges cleanly, then
    // interleave by start date. Org name shown only when parent spans orgs.
    const multiOrg = orgNames.size > 1
    const ranges = [...orgNames.keys()]
      .flatMap(orgId =>
        groupHolidayRanges(rows.filter(r => r.orgId === orgId)).map(r => ({
          ...r,
          orgName: multiOrg ? orgNames.get(orgId) ?? null : null
        }))
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))

    const nearest = ranges[0]
    const next =
      nearest && daysBetween(today, nearest.startDate) <= 30
        ? { ...nearest, daysUntil: Math.max(0, daysBetween(today, nearest.startDate)) }
        : null

    return NextResponse.json({ success: true, today, next, upcoming: ranges.slice(0, 6) })
  } catch (err) {
    console.error('parent holidays:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load holidays' },
      { status: 500 }
    )
  }
}
