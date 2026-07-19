import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { linkedStudentsWhere, requireParentFromUserId } from '@/lib/parent-portal'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { buildSchedule, istDateString, toWardLite, wardSelect, type ScheduleItem } from '@/lib/parent-schedule'

/**
 * Parent home BFF: one round trip for the mobile home screen — kid cards
 * with today's attendance, next fee due, and the next org event. Trimmed
 * down from the web `/api/v1/parent/dashboard` payload (no marketplace/
 * discovery widgets — not relevant on mobile).
 *
 * `/api/mobile/*` paths are exempt from the middleware Bearer→header
 * rewrite (src/middleware.ts) — this route verifies the JWT itself, same
 * pattern as `/api/mobile/v1/devices/push-token`.
 */
export async function GET(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }
  if (claims.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Parent role required' }, { status: 403 })
  }

  const parent = await requireParentFromUserId(claims.userId)
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Parent account not found' }, { status: 404 })
  }

  const todayIst = istDateString()

  const wardsRaw = await prisma.student.findMany({
    where: { ...linkedStudentsWhere(parent), status: 'ACTIVE' },
    select: wardSelect
  })
  const wards = wardsRaw.map(toWardLite)
  const wardIds = wards.map((w) => w.id)

  // 30-day window so "next event" can look further ahead than "today".
  const dates: string[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(`${todayIst}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const [todayAttendance, dueInvoices, schedule] = await Promise.all([
    wardIds.length
      ? prisma.attendanceRecord.findMany({
          where: { studentId: { in: wardIds }, date: new Date(`${todayIst}T00:00:00.000Z`) },
          select: { studentId: true, status: true }
        })
      : Promise.resolve([]),
    wardIds.length
      ? prisma.invoice.findMany({
          where: {
            studentId: { in: wardIds },
            deletedAt: null,
            status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] }
          },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            totalAmount: true,
            paidAmount: true,
            studentId: true
          }
        })
      : Promise.resolve([]),
    buildSchedule(wards, dates)
  ])

  const attendanceByStudent = new Map(todayAttendance.map((r) => [r.studentId, r.status]))

  const dueByStudent = new Map<string, (typeof dueInvoices)[number]>()
  for (const inv of dueInvoices) {
    // Already sorted by dueDate asc — first hit per student is the soonest.
    if (!dueByStudent.has(inv.studentId)) dueByStudent.set(inv.studentId, inv)
  }

  const nextEventByOrg = new Map<string, ScheduleItem>()
  for (const item of schedule) {
    if (item.type !== 'EVENT' || !item.orgId) continue
    if (!nextEventByOrg.has(item.orgId)) nextEventByOrg.set(item.orgId, item)
  }

  const kids = wards.map((w) => {
    const inv = dueByStudent.get(w.id)
    const nextEvent = nextEventByOrg.get(w.orgId)
    return {
      studentId: w.id,
      name: w.name,
      gradeLabel: w.gradeLabel,
      section: w.section,
      orgName: w.orgName,
      attendanceToday: attendanceByStudent.get(w.id) ?? null,
      nextFeeDue: inv
        ? {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            dueDate: inv.dueDate,
            balance: Number(inv.totalAmount) - Number(inv.paidAmount)
          }
        : null,
      nextEvent: nextEvent
        ? { title: nextEvent.title, date: nextEvent.date, startTime: nextEvent.startTime }
        : null
    }
  })

  return NextResponse.json({ success: true, kids })
}
