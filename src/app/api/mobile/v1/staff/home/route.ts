import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { ROLES } from '@/constants/roles'
import { getTeacherAssignments } from '@/lib/attendance/access'
import { forOrg } from '@/lib/db/tenant'
import { isLearningCentre } from '@/lib/institution'

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

type Tile = { key: string; label: string; value: string; hint?: string; route?: string }
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

async function adminTiles(
  orgId: string,
  institutionType: string,
  modules: Set<string>
): Promise<{ tiles: Tile[]; attention: AttentionItem[] }> {
  const today = startOfToday()
  const now = new Date()
  const hasLeads = modules.has('lead_management')
  const hasFees = modules.has('fee_management')

  const [newLeadsToday, followUpsDue, feesToday, attendanceToday, overdueFollowUps, topOverdueInvoices] =
    await Promise.all([
      hasLeads
        ? prisma.lead.count({ where: { orgId, deletedAt: null, createdAt: { gte: today } } })
        : Promise.resolve(0),
      hasLeads
        ? prisma.lead.count({
            where: {
              orgId,
              deletedAt: null,
              nextFollowUpAt: { lte: now },
              status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
            }
          })
        : Promise.resolve(0),
      prisma.payment.aggregate({
        where: { orgId, status: 'SUCCESS', paidAt: { gte: today } },
        _sum: { amount: true }
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { orgId, date: today },
        _count: { status: true }
      }),
      hasLeads
        ? prisma.lead.findMany({
            where: {
              orgId,
              deletedAt: null,
              nextFollowUpAt: { lte: now },
              status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] }
            },
            orderBy: { nextFollowUpAt: 'asc' },
            take: 3,
            select: { id: true, parentName: true, kidName: true, nextFollowUpAt: true }
          })
        : Promise.resolve([]),
      hasFees
        ? prisma.invoice.findMany({
            where: {
              orgId,
              deletedAt: null,
              status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
              dueDate: { lt: new Date(now.getTime() - 14 * 86_400_000) }
            },
            orderBy: { dueDate: 'asc' },
            take: 2,
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              paidAmount: true,
              dueDate: true,
              student: { select: { name: true } }
            }
          })
        : Promise.resolve([])
    ])

  const attention: AttentionItem[] = [
    ...overdueFollowUps.map((l) => ({
      id: l.id,
      type: 'follow_up_due',
      title: `Overdue follow-up · ${l.parentName}`,
      subtitle: l.kidName ? `Lead · ${l.kidName}` : 'Lead · follow-up due',
      route: `/leads/${l.id}`
    })),
    ...topOverdueInvoices.map((inv) => {
      const days = inv.dueDate ? Math.floor((now.getTime() - inv.dueDate.getTime()) / 86_400_000) : 0
      const balance = Number(inv.totalAmount) - Number(inv.paidAmount)
      return {
        id: inv.id,
        type: 'invoice_overdue',
        title: `Big overdue · ₹${Math.round(balance).toLocaleString('en-IN')}`,
        subtitle: `${inv.student.name} · ${inv.invoiceNumber} · ${days}d`,
        route: '/fees'
      }
    })
  ]

  if (isLearningCentre(institutionType)) {
    // LC variant (wireframe s-home-lc): collections lead, plus today's
    // session load from the schedule module.
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [monthCollected, sessionsToday, sessionsDone] = await Promise.all([
      prisma.payment.aggregate({
        where: { orgId, status: 'SUCCESS', deletedAt: null, paidAt: { gte: monthStart } },
        _sum: { amount: true }
      }),
      prisma.courseSession.count({
        where: { orgId, deletedAt: null, status: { not: 'CANCELLED' }, startsAt: { gte: today, lt: tomorrow } }
      }),
      prisma.courseSession.count({
        where: { orgId, deletedAt: null, status: { not: 'CANCELLED' }, startsAt: { gte: today, lt: now } }
      })
    ])
    const lcLeadTiles: Tile[] = hasLeads
      ? [
          { key: 'leads_today', label: 'New enquiries today', value: String(newLeadsToday), route: '/leads' },
          { key: 'followups_due', label: 'Follow-ups due', value: String(followUpsDue), route: '/leads' }
        ]
      : [
          {
            key: 'active_students',
            label: 'Active students',
            value: String(await prisma.student.count({ where: { orgId, deletedAt: null, status: 'ACTIVE' } })),
            route: '/students'
          },
          { key: 'fees_today', label: 'Collected today', value: inr(Number(feesToday._sum.amount ?? 0)), route: '/fees' }
        ]
    return {
      tiles: [
        { key: 'month_collected', label: 'Collected this month', value: inr(Number(monthCollected._sum.amount ?? 0)), route: '/collections' },
        ...lcLeadTiles,
        {
          key: 'sessions_today',
          label: 'Sessions today',
          value: sessionsToday === 0 ? '0' : `${sessionsToday} · ${sessionsToday - sessionsDone} left`,
          route: '/schedule'
        }
      ],
      attention
    }
  }

  // School variant: "Classes marked X / Y" = distinct class-sections with an
  // attendance record today vs class-sections that have active students.
  const [markedGroups, allGroups] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { orgId, date: today },
      distinct: ['studentId'],
      select: { student: { select: { gradeLabel: true, section: true } } }
    }),
    prisma.student.groupBy({
      by: ['gradeLabel', 'section'],
      where: { orgId, deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } }
    })
  ])
  const markedSet = new Set(
    markedGroups.map((r) => `${r.student.gradeLabel ?? ''}|${r.student.section ?? ''}`)
  )
  const totalClasses = allGroups.length

  // Lead tiles only when the org licenses lead_management — otherwise show
  // student/dues numbers so the grid stays full (and never routes to a 403).
  const [activeStudents, openDues] = hasLeads
    ? [0, 0]
    : await Promise.all([
        prisma.student.count({ where: { orgId, deletedAt: null, status: 'ACTIVE' } }),
        prisma.invoice
          .aggregate({
            where: { orgId, deletedAt: null, status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
            _sum: { totalAmount: true, paidAmount: true }
          })
          .then((r) => Number(r._sum.totalAmount ?? 0) - Number(r._sum.paidAmount ?? 0))
      ])

  const leadTiles: Tile[] = hasLeads
    ? [
        { key: 'leads_today', label: 'New leads today', value: String(newLeadsToday), route: '/leads' },
        { key: 'followups_due', label: 'Follow-ups due', value: String(followUpsDue), route: '/leads' }
      ]
    : [
        { key: 'active_students', label: 'Active students', value: String(activeStudents), route: '/students' },
        { key: 'open_dues', label: 'Open dues', value: inr(openDues), route: '/fees' }
      ]

  return {
    tiles: [
      ...leadTiles,
      { key: 'fees_today', label: 'Collected today', value: inr(Number(feesToday._sum.amount ?? 0)), route: '/fees' },
      {
        key: 'classes_marked',
        label: 'Classes marked',
        value: totalClasses > 0 ? `${markedSet.size} / ${totalClasses}` : 'No classes',
        route: '/attendance'
      }
    ],
    attention
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

  const [org, unread, orgModules] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { institutionType: true, name: true } }),
    prisma.notification.count({
      where: { orgId, recipientType: 'USER', recipientId: userId, deletedAt: null, readAt: null }
    }),
    prisma.organizationModule.findMany({
      where: { orgId, enabled: true },
      select: { module: { select: { slug: true } } }
    })
  ])
  const institutionType = org?.institutionType ?? 'SCHOOL'
  const modules = orgModules.map((m) => m.module.slug)

  const { tiles, attention } = ADMIN_ROLES.includes(role)
    ? await adminTiles(orgId, institutionType, new Set(modules))
    : role === ROLES.TEACHER
      ? await teacherTiles(orgId, userId)
      : role === ROLES.COUNSELLOR
        ? await counsellorTiles(orgId, userId)
        : { tiles: [], attention: [] } // RECEPTIONIST/ACCOUNTANT: no tiles yet, not a crash

  return NextResponse.json({
    success: true,
    role,
    institutionType,
    orgName: org?.name ?? null,
    modules,
    unread,
    tiles,
    attention
  })
}
