import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST],
  handler: async ({ db }) => {
    const now = new Date()
    const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const [upcoming, drafts, upcomingRsvps, pastRsvps] = await Promise.all([
      db.event.count({
        where: {
          status: 'PUBLISHED',
          OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }]
        }
      }),
      db.event.count({ where: { status: 'DRAFT' } }),
      db.eventRsvp.count({
        where: {
          status: { in: ['GOING', 'MAYBE'] },
          event: {
            status: 'PUBLISHED',
            deletedAt: null,
            OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }]
          }
        }
      }),
      // attendance over completed events in the last 90 days
      db.eventRsvp.groupBy({
        by: ['status'],
        where: {
          status: { in: ['GOING', 'ATTENDED'] },
          event: { startsAt: { gte: past90, lt: now }, deletedAt: null }
        },
        _count: { status: true }
      })
    ])

    const attended = pastRsvps.find(r => r.status === 'ATTENDED')?._count.status ?? 0
    const wentOrPlanned = pastRsvps.reduce((sum, r) => sum + r._count.status, 0)
    const attendanceRate = wentOrPlanned > 0 ? Math.round((attended / wentOrPlanned) * 100) : 0

    return ok({ upcoming, drafts, upcomingRsvps, attendanceRate })
  }
})
