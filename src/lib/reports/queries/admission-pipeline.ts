import { median } from '../insights'
import { ayScope, branchScope } from './scope'
import {
  ReportQuery, ReportCtx, Filters, rangeFilter, listFilter
} from './types'

function whereFor(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const grades = listFilter(filters.grade)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(ctx.branchIds),
    ...(range ? { createdAt: range } : {}),
    ...(grades ? { gradeSought: { in: grades } } : {}),
    ...(filters.counsellorId ? { assignedToId: filters.counsellorId } : {}),
    ...(filters.stageId ? { stageId: filters.stageId } : {}),
    ...(ctx.role === 'COUNSELLOR' ? { assignedToId: ctx.userId } : {})
  }
}

async function stageTable(ctx: ReportCtx, filters: Filters) {
  const where = whereFor(ctx, filters)
  const d14Ago = new Date(Date.now() - 14 * 864e5)

  const [stages, inProgress, ageing] = await Promise.all([
    ctx.db.admissionStage.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, isWon: true, isLost: true }
    }),
    ctx.db.admission.groupBy({
      by: ['stageId'],
      where: { ...where, status: 'IN_PROGRESS' },
      _count: { _all: true }
    }),
    ctx.db.admission.findMany({
      where: { ...where, status: 'IN_PROGRESS' },
      select: { stageId: true, updatedAt: true },
      take: 5000
    })
  ])

  const countMap = new Map(
    inProgress.filter(r => r.stageId).map(r => [r.stageId!, r._count._all])
  )
  const idleByStage = new Map<string, number[]>()
  let stuckTotal = 0
  const now = Date.now()
  for (const a of ageing) {
    if (!a.stageId) continue
    const days = (now - a.updatedAt.getTime()) / 864e5
    if (a.updatedAt < d14Ago) stuckTotal++
    const list = idleByStage.get(a.stageId) ?? []
    list.push(days)
    idleByStage.set(a.stageId, list)
  }

  const rows = stages
    .filter(s => !s.isWon && !s.isLost)
    .map(s => {
      const idle = idleByStage.get(s.id) ?? []
      return {
        stageId: s.id,
        stage: s.name,
        inProgress: countMap.get(s.id) ?? 0,
        medianDaysIdle: median(idle) !== null ? Math.round(median(idle)! * 10) / 10 : null,
        stuck14d: idle.filter(d => d > 14).length
      }
    })
  return { rows, stuckTotal }
}

export const admissionPipeline: ReportQuery = {
  async summary(ctx, filters) {
    const where = whereFor(ctx, filters)
    const [{ rows, stuckTotal }, inProgressTotal, admitted, capacity, docsPending] =
      await Promise.all([
        stageTable(ctx, filters),
        ctx.db.admission.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        ctx.db.admission.count({ where: { ...where, status: 'ADMITTED' } }),
        ctx.academicYearId
          ? ctx.db.admissionCapacity.findMany({
              where: { academicYearId: ctx.academicYearId, ...branchScope(ctx.branchIds) },
              select: { gradeLabel: true, totalSeats: true, filledSeats: true }
            })
          : [],
        ctx.db.admissionDocument.count({ where: { scanStatus: 'PENDING', deletedAt: null } })
      ])

    const totalSeats = capacity.reduce((s, c) => s + c.totalSeats, 0)
    const filledSeats = capacity.reduce((s, c) => s + c.filledSeats, 0)

    const worstStage = [...rows]
      .filter(r => r.stuck14d > 0)
      .sort((a, b) => b.stuck14d - a.stuck14d)[0]

    return {
      kpis: [
        { key: 'inProgress', label: 'In Progress', value: inProgressTotal, format: 'int' },
        { key: 'admitted', label: 'Admitted', value: admitted, format: 'int' },
        { key: 'capacityFill', label: 'Seats Filled', value: totalSeats > 0 ? filledSeats / totalSeats : null, format: 'pct', caption: totalSeats > 0 ? `${filledSeats}/${totalSeats} seats` : 'no capacity set' },
        { key: 'stuck', label: 'Stuck 14d+', value: stuckTotal, format: 'int' },
        { key: 'docsPending', label: 'Documents Pending', value: docsPending, format: 'int' }
      ],
      insight: worstStage
        ? `"${worstStage.stage}" holds the most stuck applications (${worstStage.stuck14d}) — clear it first.`
        : null,
      charts: {
        stages: rows.map(r => ({ stage: r.stage, count: r.inProgress, stuck: r.stuck14d })),
        capacity: capacity
          .map(c => ({ grade: c.gradeLabel, totalSeats: c.totalSeats, filledSeats: c.filledSeats }))
          .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }))
      }
    }
  },

  async rows(ctx, filters) {
    const { rows } = await stageTable(ctx, filters)
    return {
      columns: [
        { key: 'stage', label: 'Stage' },
        { key: 'inProgress', label: 'Applications', format: 'int' },
        { key: 'medianDaysIdle', label: 'Median Days Idle', format: 'int' },
        { key: 'stuck14d', label: 'Stuck 14d+', format: 'int' }
      ],
      rows: rows.map(({ stageId: _s, ...r }) => r),
      nextCursor: null
    }
  }
}
