import { prisma } from '@/lib/db/client'
import { ReportQuery, ReportCtx, Filters, rangeFilter, offsetCursor, nextOffsetCursor } from './types'

// Front-desk / counsellor operational log. COUNSELLOR sees own activity;
// RECEPTIONIST and admins see the whole org's day.

function activityWhere(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  return {
    createdAt: range ?? { gte: startOfToday },
    ...(filters.type ? { type: filters.type as never } : {}),
    ...(ctx.role === 'COUNSELLOR' ? { performedById: ctx.userId } : {})
  }
}

export const dailyActivity: ReportQuery = {
  async summary(ctx, filters) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const d7Ago = new Date(Date.now() - 7 * 864e5)
    const mine = ctx.role === 'COUNSELLOR' ? { assignedToId: ctx.userId } : {}
    const minePerformed = ctx.role === 'COUNSELLOR' ? { performedById: ctx.userId } : {}

    const [leadsToday, activitiesToday, byType, walkIns7d, admissionsToday] = await Promise.all([
      ctx.db.lead.count({ where: { ...mine, createdAt: { gte: startOfToday } } }),
      ctx.db.leadActivity.count({ where: { ...minePerformed, createdAt: { gte: startOfToday } } }),
      ctx.db.leadActivity.groupBy({
        by: ['type'],
        where: activityWhere(ctx, filters),
        _count: { _all: true }
      }),
      ctx.db.lead.count({ where: { ...mine, source: 'WALK_IN', createdAt: { gte: d7Ago } } }),
      ctx.db.admission.count({
        where: {
          ...(ctx.role === 'COUNSELLOR' ? { assignedToId: ctx.userId } : {}),
          createdAt: { gte: startOfToday }
        }
      })
    ])

    const calls = byType.find(t => t.type === 'CALL')?._count._all ?? 0

    return {
      kpis: [
        { key: 'leadsToday', label: 'New Leads Today', value: leadsToday, format: 'int' },
        { key: 'activities', label: 'Activities Logged', value: activitiesToday, format: 'int', caption: 'today' },
        { key: 'calls', label: 'Calls', value: calls, format: 'int', caption: 'in selected period' },
        { key: 'walkIns', label: 'Walk-ins', value: walkIns7d, format: 'int', caption: 'last 7 days' },
        { key: 'admissionsToday', label: 'Applications Today', value: admissionsToday, format: 'int' }
      ],
      insight:
        activitiesToday === 0 && leadsToday > 0
          ? `${leadsToday} new lead${leadsToday === 1 ? '' : 's'} today with no logged activity yet — first response clock is ticking.`
          : null,
      charts: {
        byType: byType.map(t => ({
          type: String(t.type).replace(/_/g, ' '),
          count: t._count._all
        }))
      }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const activities = await ctx.db.leadActivity.findMany({
      where: activityWhere(ctx, filters),
      select: {
        createdAt: true, type: true, summary: true, performedById: true,
        lead: { select: { leadCode: true, parentName: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    const userIds = [...new Set(activities.map(a => a.performedById).filter(Boolean))] as string[]
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds }, orgId: ctx.orgId },
          select: { id: true, name: true }
        })
      : []
    const nameMap = new Map(users.map(u => [u.id, u.name]))

    return {
      columns: [
        { key: 'createdAt', label: 'When', format: 'date' },
        { key: 'type', label: 'Type', format: 'badge' },
        { key: 'summary', label: 'Summary' },
        { key: 'lead', label: 'Lead' },
        { key: 'performedBy', label: 'By' }
      ],
      rows: activities.map(a => ({
        createdAt: a.createdAt,
        type: a.type,
        summary: a.summary,
        lead: a.lead ? `${a.lead.leadCode} · ${a.lead.parentName}` : '—',
        performedBy: a.performedById ? nameMap.get(a.performedById) ?? '—' : 'System'
      })),
      nextCursor: nextOffsetCursor(offset, limit, activities.length)
    }
  }
}
