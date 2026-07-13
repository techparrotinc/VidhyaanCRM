import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { buildSchedule, istDateString, toWardLite, wardSelect } from '@/lib/parent-schedule'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parent schedule: school timetable slots + LC batch times + events + fee due
 * dates, merged per ward. Defaults to the next 7 IST days; `?from=YYYY-MM-DD`
 * and `?days=N` (≤42) support past weeks and month views.
 */
export async function GET(req: NextRequest) {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const wardsRaw = await prisma.student.findMany({
      where: { ...linkedStudentsWhere(parent), status: 'ACTIVE' },
      select: wardSelect
    })
    const wards = wardsRaw.map(toWardLite)

    const todayIst = istDateString()
    const fromParam = req.nextUrl.searchParams.get('from')
    const daysParam = Number(req.nextUrl.searchParams.get('days') ?? 7)
    const from = fromParam && DATE.test(fromParam) ? fromParam : todayIst
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(Math.trunc(daysParam), 1), 42) : 7

    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(`${from}T00:00:00.000Z`)
      d.setUTCDate(d.getUTCDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }

    const items = await buildSchedule(wards, dates)

    return NextResponse.json({
      success: true,
      data: {
        today: todayIst,
        dates,
        wards: wards.map((w) => ({
          id: w.id,
          name: w.name,
          gradeLabel: w.gradeLabel,
          section: w.section,
          orgName: w.orgName
        })),
        items
      }
    })
  } catch (error: any) {
    console.error('Parent timetable error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load timetable' }, { status: 500 })
  }
}
