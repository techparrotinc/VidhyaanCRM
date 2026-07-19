import { prisma } from '@/lib/db/client'
import { OPEN_LEAD_STATUSES } from './scope'
import {
  ReportQuery, ReportCtx, Filters,
  listFilter, leadBaseWhere, offsetCursor, nextOffsetCursor
} from './types'

function whereFor(ctx: ReportCtx, filters: Filters) {
  const grades = listFilter(filters.grade)
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  return {
    ...leadBaseWhere(ctx),
    status: { in: [...OPEN_LEAD_STATUSES] },
    nextFollowUpAt: filters.overdue === 'true' ? { lt: startOfToday } : { not: null },
    ...(grades ? { gradeSought: { in: grades } } : {}),
    ...(filters.counsellorId ? { assignedToId: filters.counsellorId } : {})
  }
}

export const followUpDiscipline: ReportQuery = {
  async summary(ctx, filters) {
    const base = whereFor(ctx, { ...filters, overdue: undefined })
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const endOfToday = new Date(startOfToday.getTime() + 864e5)
    const in7 = new Date(startOfToday.getTime() + 8 * 864e5)

    const [overdueCount, dueToday, next7, overdueDates] = await Promise.all([
      ctx.db.lead.count({ where: { ...base, nextFollowUpAt: { lt: startOfToday } } }),
      ctx.db.lead.count({ where: { ...base, nextFollowUpAt: { gte: startOfToday, lt: endOfToday } } }),
      ctx.db.lead.count({ where: { ...base, nextFollowUpAt: { gte: endOfToday, lt: in7 } } }),
      ctx.db.lead.findMany({
        where: { ...base, nextFollowUpAt: { lt: startOfToday } },
        select: { nextFollowUpAt: true },
        take: 2000
      })
    ])

    const avgDaysOverdue =
      overdueDates.length > 0
        ? overdueDates.reduce(
            (s, l) => s + (startOfToday.getTime() - l.nextFollowUpAt!.getTime()) / 864e5,
            0
          ) / overdueDates.length
        : null

    return {
      kpis: [
        { key: 'overdue', label: 'Overdue', value: overdueCount, format: 'int' },
        { key: 'dueToday', label: 'Due Today', value: dueToday, format: 'int' },
        { key: 'next7', label: 'Next 7 Days', value: next7, format: 'int' },
        { key: 'avgDaysOverdue', label: 'Avg Days Overdue', value: avgDaysOverdue !== null ? Math.round(avgDaysOverdue * 10) / 10 : null, format: 'int' }
      ],
      insight:
        overdueCount > 0
          ? `${overdueCount} promised follow-up${overdueCount === 1 ? ' is' : 's are'} overdue — every silent day cuts conversion odds.`
          : 'No overdue follow-ups. Keep it that way.',
      charts: {}
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))

    const leads = await ctx.db.lead.findMany({
      where: whereFor(ctx, filters),
      select: {
        id: true, leadCode: true, parentName: true, kidName: true, phone: true,
        gradeSought: true, priority: true, status: true,
        nextFollowUpAt: true, updatedAt: true, assignedToId: true
      },
      orderBy: { nextFollowUpAt: 'asc' },
      skip: offset,
      take: limit
    })

    const counsellorIds = [...new Set(leads.map(l => l.assignedToId).filter(Boolean))] as string[]
    const users = counsellorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: counsellorIds }, orgId: ctx.orgId },
          select: { id: true, name: true }
        })
      : []
    const nameMap = new Map(users.map(u => [u.id, u.name]))

    return {
      columns: [
        { key: 'leadCode', label: 'Lead' },
        { key: 'parentName', label: 'Parent' },
        { key: 'kidName', label: 'Child' },
        { key: 'gradeSought', label: 'Grade' },
        { key: 'counsellor', label: 'Counsellor' },
        { key: 'nextFollowUpAt', label: 'Due', format: 'date' },
        { key: 'daysOverdue', label: 'Days Overdue', format: 'int' },
        { key: 'priority', label: 'Priority', format: 'badge' },
        { key: 'phone', label: 'Phone' }
      ],
      rows: leads.map(l => ({
        __href: `/lead-management/${l.id}`,
        leadCode: l.leadCode,
        parentName: l.parentName,
        kidName: l.kidName ?? '',
        gradeSought: l.gradeSought ?? '',
        counsellor: l.assignedToId ? nameMap.get(l.assignedToId) ?? '—' : 'Unassigned',
        nextFollowUpAt: l.nextFollowUpAt,
        daysOverdue: l.nextFollowUpAt && l.nextFollowUpAt < startOfToday
          ? Math.floor((startOfToday.getTime() - l.nextFollowUpAt.getTime()) / 864e5)
          : 0,
        priority: l.priority,
        phone: l.phone
      })),
      nextCursor: nextOffsetCursor(offset, limit, leads.length)
    }
  }
}
