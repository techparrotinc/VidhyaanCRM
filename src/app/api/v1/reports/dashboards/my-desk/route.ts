import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { median } from '@/lib/reports/insights'
import { ayScope, OPEN_LEAD_STATUSES } from '@/lib/reports/queries/scope'

const FOLLOW_UP_SELECT = {
  id: true, leadCode: true, parentName: true, kidName: true, phone: true,
  gradeSought: true, priority: true, nextFollowUpAt: true, status: true
} as const

// Counsellor work queue + scoreboard. Per-user data — not cached.
// COUNSELLOR sees own leads; RECEPTIONIST sees the whole org's queue
// (front desk triages unassigned and walk-in follow-ups).
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['COUNSELLOR', 'RECEPTIONIST', 'ORG_ADMIN', 'BRANCH_ADMIN'],
  handler: async ({ req, user, db }) => {
    const { academicYearId } = parseQuery(req.url, { academicYearId: textParam })
    const ay = ayScope(academicYearId)
    const mine = user.role === 'COUNSELLOR' ? { assignedToId: user.id } : {}
    const open = { status: { in: [...OPEN_LEAD_STATUSES] } }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
    const in7Days = new Date(startOfToday.getTime() + 8 * 24 * 60 * 60 * 1000)
    const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const d90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const [
      overdueCount, overdueList,
      todayCount, todayList,
      upcomingCount, upcomingList,
      pipeline,
      goneCold,
      target,
      myResponsePairs, orgResponsePairs
    ] = await Promise.all([
      db.lead.count({ where: { ...ay, ...mine, ...open, nextFollowUpAt: { lt: startOfToday } } }),
      db.lead.findMany({
        where: { ...ay, ...mine, ...open, nextFollowUpAt: { lt: startOfToday } },
        select: FOLLOW_UP_SELECT,
        orderBy: { nextFollowUpAt: 'asc' },
        take: 10
      }),
      db.lead.count({ where: { ...ay, ...mine, ...open, nextFollowUpAt: { gte: startOfToday, lt: endOfToday } } }),
      db.lead.findMany({
        where: { ...ay, ...mine, ...open, nextFollowUpAt: { gte: startOfToday, lt: endOfToday } },
        select: FOLLOW_UP_SELECT,
        orderBy: { nextFollowUpAt: 'asc' },
        take: 10
      }),
      db.lead.count({ where: { ...ay, ...mine, ...open, nextFollowUpAt: { gte: endOfToday, lt: in7Days } } }),
      db.lead.findMany({
        where: { ...ay, ...mine, ...open, nextFollowUpAt: { gte: endOfToday, lt: in7Days } },
        select: FOLLOW_UP_SELECT,
        orderBy: { nextFollowUpAt: 'asc' },
        take: 5
      }),
      db.lead.groupBy({
        by: ['status'],
        where: { ...ay, ...mine },
        _count: { _all: true }
      }),
      db.lead.findMany({
        where: {
          ...ay, ...mine,
          status: { in: ['INTERESTED', 'FOLLOW_UP_PENDING'] },
          updatedAt: { lt: d7Ago }
        },
        select: { ...FOLLOW_UP_SELECT, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
        take: 10
      }),
      user.role === 'COUNSELLOR'
        ? db.counsellorTarget.findFirst({
            where: {
              userId: user.id,
              periodStart: { lte: now },
              periodEnd: { gte: now }
            }
          })
        : null,
      db.lead.findMany({
        where: {
          ...mine,
          createdAt: { gte: d90Ago },
          firstContactedAt: { not: null }
        },
        select: { createdAt: true, firstContactedAt: true },
        take: 500
      }),
      db.lead.findMany({
        where: { createdAt: { gte: d90Ago }, firstContactedAt: { not: null } },
        select: { createdAt: true, firstContactedAt: true },
        take: 1000
      })
    ])

    // Target attainment: leads handled + conversions inside the target period.
    let targets = null
    if (target) {
      const period = { gte: target.periodStart, lte: target.periodEnd }
      const [assigned, converted] = await Promise.all([
        db.lead.count({
          where: { assignedToId: user.id, createdAt: period }
        }),
        db.admission.count({
          where: { assignedToId: user.id, createdAt: period }
        })
      ])
      targets = {
        periodStart: target.periodStart,
        periodEnd: target.periodEnd,
        leadTarget: target.leadTarget,
        leadActual: assigned,
        conversionTarget: target.conversionTarget,
        conversionActual: converted
      }
    }

    const hours = (pairs: { createdAt: Date; firstContactedAt: Date | null }[]) =>
      median(
        pairs
          .filter(p => p.firstContactedAt)
          .map(p => (p.firstContactedAt!.getTime() - p.createdAt.getTime()) / 36e5)
      )

    return ok({
      followups: {
        overdue: { count: overdueCount, leads: overdueList },
        today: { count: todayCount, leads: todayList },
        upcoming: { count: upcomingCount, leads: upcomingList }
      },
      targets,
      responseTime: {
        myMedianHours: hours(myResponsePairs),
        orgMedianHours: hours(orgResponsePairs)
      },
      pipeline: pipeline.map(p => ({ status: p.status, count: p._count._all })),
      goneCold
    })
  }
})
