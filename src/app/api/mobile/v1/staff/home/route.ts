import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { ROLES } from '@/constants/roles'
import { getTeacherAssignments } from '@/lib/attendance/access'
import { forOrg } from '@/lib/db/tenant'

/**
 * Staff home BFF (mobile-app-plan §4.3): one round trip for the staff-app
 * home screen — role-aware KPI tiles + a short "needs attention" list.
 * Deliberately thin and role-scoped, unlike the web `/api/v1/dashboard/
 * summary` (13 org-wide aggregate queries built for an admin console) —
 * mobile only needs today's numbers for the signed-in person's own scope.
 *
 * `/api/mobile/*` paths are exempt from the middleware Bearer→header
 * rewrite — this route verifies the JWT itself, same pattern as
 * `/api/mobile/v1/parent/home`.
 */

type Tile = { key: string; label: string; value: string; hint?: string }
type AttentionItem = { id: string; type: string; title: string; subtitle: string; route: string }

const ADMIN_ROLES: string[] = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

async function adminTiles(orgId: string): Promise<{ tiles: Tile[]; attention: AttentionItem[] }> {
  const today = startOfToday()
  const now = new Date()

  const [newLeadsToday, followUpsDue, feesToday, attendanceToday, overdueFollowUps] = await Promise.all([
    prisma.lead.count({ where: { orgId, deletedAt: null, createdAt: { gte: today } } }),
    prisma.lead.count({
      where: {
        orgId,
        deletedAt: null,
        nextFollowUpAt: { lte: now },
        status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
      }
    }),
    prisma.payment.aggregate({
      where: { orgId, status: 'SUCCESS', paidAt: { gte: today } },
      _sum: { amount: true }
    }),
    prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { orgId, date: today },
      _count: { status: true }
    }),
    prisma.lead.findMany({
      where: {
        orgId,
        deletedAt: null,
        nextFollowUpAt: { lte: now },
        status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
      },
      orderBy: { nextFollowUpAt: 'asc' },
      take: 5,
      select: { id: true, parentName: true, kidName: true, nextFollowUpAt: true }
    })
  ])

  const totalMarked = attendanceToday.reduce((sum, r) => sum + r._count.status, 0)
  const present = attendanceToday.find((r) => r.status === 'PRESENT')?._count.status ?? 0
  const attendancePct = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null

  return {
    tiles: [
      { key: 'leads_today', label: 'New leads today', value: String(newLeadsToday) },
      { key: 'followups_due', label: 'Follow-ups due', value: String(followUpsDue) },
      { key: 'fees_today', label: 'Fees collected today', value: inr(Number(feesToday._sum.amount ?? 0)) },
      {
        key: 'attendance_today',
        label: 'Attendance today',
        value: attendancePct === null ? 'Not marked' : `${attendancePct}%`,
        hint: totalMarked > 0 ? `${totalMarked} marked` : undefined
      }
    ],
    attention: overdueFollowUps.map((l) => ({
      id: l.id,
      type: 'follow_up_due',
      title: l.parentName,
      subtitle: l.kidName ? `${l.kidName} · follow-up due` : 'Follow-up due',
      route: `/leads/${l.id}`
    }))
  }
}

async function counsellorTiles(orgId: string, userId: string): Promise<{ tiles: Tile[]; attention: AttentionItem[] }> {
  const today = startOfToday()
  const now = new Date()

  const [myLeadsToday, myFollowUpsDue, myConvertedThisMonth, overdueFollowUps] = await Promise.all([
    prisma.lead.count({ where: { orgId, deletedAt: null, assignedToId: userId, createdAt: { gte: today } } }),
    prisma.lead.count({
      where: {
        orgId,
        deletedAt: null,
        assignedToId: userId,
        nextFollowUpAt: { lte: now },
        status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
      }
    }),
    prisma.lead.count({
      where: {
        orgId,
        deletedAt: null,
        assignedToId: userId,
        status: 'CONVERTED',
        updatedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      }
    }),
    prisma.lead.findMany({
      where: {
        orgId,
        deletedAt: null,
        assignedToId: userId,
        nextFollowUpAt: { lte: now },
        status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
      },
      orderBy: { nextFollowUpAt: 'asc' },
      take: 5,
      select: { id: true, parentName: true, kidName: true }
    })
  ])

  return {
    tiles: [
      { key: 'my_leads_today', label: 'New leads today', value: String(myLeadsToday) },
      { key: 'my_followups_due', label: 'Follow-ups due', value: String(myFollowUpsDue) },
      { key: 'my_converted', label: 'Converted this month', value: String(myConvertedThisMonth) }
    ],
    attention: overdueFollowUps.map((l) => ({
      id: l.id,
      type: 'follow_up_due',
      title: l.parentName,
      subtitle: l.kidName ? `${l.kidName} · follow-up due` : 'Follow-up due',
      route: `/leads/${l.id}`
    }))
  }
}

async function teacherTiles(orgId: string, userId: string): Promise<{ tiles: Tile[]; attention: AttentionItem[] }> {
  const db = forOrg(orgId)
  const assignments = await getTeacherAssignments(db, userId)
  const courseIds = assignments.map((a) => a.courseId).filter((v): v is string => !!v)
  const batchIds = assignments.map((a) => a.batchId).filter((v): v is string => !!v)

  const today = startOfToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const now = new Date()

  const sessions =
    courseIds.length || batchIds.length
      ? await db.courseSession.findMany({
          where: {
            deletedAt: null,
            startsAt: { gte: today, lt: tomorrow },
            status: { not: 'CANCELLED' },
            OR: [{ teacherId: userId }, { courseId: { in: courseIds } }, { batchId: { in: batchIds } }]
          },
          orderBy: { startsAt: 'asc' },
          include: {
            course: { select: { name: true } },
            batch: { select: { name: true } }
          }
        })
      : []

  const attendanceSessionIds = sessions.map((s) => s.attendanceSessionId).filter((v): v is string => !!v)
  const markedCounts = attendanceSessionIds.length
    ? await prisma.attendanceRecord.groupBy({
        by: ['sessionId'],
        where: { sessionId: { in: attendanceSessionIds } },
        _count: { id: true }
      })
    : []
  const markedBySessionId = new Map(markedCounts.map((m) => [m.sessionId, m._count.id]))

  const unmarked = sessions.filter((s) => {
    const started = s.startsAt <= now
    const marked = s.attendanceSessionId ? (markedBySessionId.get(s.attendanceSessionId) ?? 0) > 0 : false
    return started && !marked
  })

  return {
    tiles: [
      { key: 'sessions_today', label: "Today's sessions", value: String(sessions.length) },
      { key: 'unmarked_sessions', label: 'Unmarked attendance', value: String(unmarked.length) }
    ],
    attention: unmarked.slice(0, 5).map((s) => ({
      id: s.id,
      type: 'unmarked_attendance',
      title: s.course?.name ?? s.batch?.name ?? 'Session',
      subtitle: `${s.startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · attendance not marked`,
      route: s.attendanceSessionId ? `/attendance/sessions/${s.attendanceSessionId}` : '/attendance'
    }))
  }
}

export async function GET(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims || !claims.orgId) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }
  if (claims.role === 'PARENT') {
    return NextResponse.json({ success: false, error: 'Staff role required' }, { status: 403 })
  }

  const { orgId, userId, role } = claims

  const { tiles, attention } = ADMIN_ROLES.includes(role)
    ? await adminTiles(orgId)
    : role === ROLES.TEACHER
      ? await teacherTiles(orgId, userId)
      : role === ROLES.COUNSELLOR
        ? await counsellorTiles(orgId, userId)
        : { tiles: [], attention: [] } // RECEPTIONIST/ACCOUNTANT: no tiles yet, not a crash

  return NextResponse.json({ success: true, role, tiles, attention })
}
