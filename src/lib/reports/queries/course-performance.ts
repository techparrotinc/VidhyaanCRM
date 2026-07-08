import { ReportQuery, ReportCtx, Filters } from './types'

// Learning-centre / coaching lens: course economics + batch fill. Monthly
// revenue run-rate = active enrollments × course fee (MONTHLY courses only —
// other frequencies shown but not annualised in Phase 1).

async function courseTable(ctx: ReportCtx, filters: Filters) {
  const statusFilter = (filters.status ?? 'ACTIVE') as never

  const [courses, enrollmentsByCourse, collectedByCourse] = await Promise.all([
    ctx.db.course.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, category: true, amount: true,
        frequency: true, durationMonths: true, isActive: true
      },
      orderBy: { name: 'asc' }
    }),
    ctx.db.courseEnrollment.groupBy({
      by: ['courseId', 'status'],
      _count: { _all: true }
    }),
    ctx.db.invoice.groupBy({
      by: ['courseId'],
      where: { courseId: { not: null }, deletedAt: null },
      _sum: { paidAmount: true, totalAmount: true }
    })
  ])

  const enrollMap = new Map<string, Map<string, number>>()
  for (const r of enrollmentsByCourse) {
    const m = enrollMap.get(r.courseId) ?? new Map()
    m.set(r.status as string, r._count._all)
    enrollMap.set(r.courseId, m)
  }
  const moneyMap = new Map(
    collectedByCourse
      .filter(r => r.courseId)
      .map(r => [r.courseId!, {
        collected: Number(r._sum.paidAmount ?? 0),
        billed: Number(r._sum.totalAmount ?? 0)
      }])
  )

  return courses.map(c => {
    const e = enrollMap.get(c.id) ?? new Map<string, number>()
    const active = e.get('ACTIVE') ?? 0
    const money = moneyMap.get(c.id) ?? { collected: 0, billed: 0 }
    return {
      courseId: c.id,
      course: c.name,
      category: (c.category as string | null) ?? '',
      fee: `₹${Number(c.amount).toLocaleString('en-IN')} / ${String(c.frequency).toLowerCase().replace(/_/g, ' ')}`,
      active,
      paused: e.get('PAUSED') ?? 0,
      completed: e.get('COMPLETED') ?? 0,
      cancelled: e.get('CANCELLED') ?? 0,
      filtered: e.get(statusFilter as string) ?? 0,
      monthlyRunRate: c.frequency === 'MONTHLY' ? active * Number(c.amount) : null,
      billed: money.billed,
      collected: money.collected
    }
  })
}

export const coursePerformance: ReportQuery = {
  async summary(ctx, filters) {
    const [table, batches] = await Promise.all([
      courseTable(ctx, filters),
      ctx.db.studentBatch.findMany({
        where: { deletedAt: null },
        select: { name: true, capacity: true, _count: { select: { students: true } } },
        take: 50
      })
    ])

    const activeCourses = table.filter(c => c.active > 0)
    const totalActive = table.reduce((s, c) => s + c.active, 0)
    const runRate = table.reduce((s, c) => s + (c.monthlyRunRate ?? 0), 0)

    const fillable = batches.filter(b => (b.capacity ?? 0) > 0)
    const avgFill = fillable.length > 0
      ? fillable.reduce((s, b) => s + b._count.students / b.capacity!, 0) / fillable.length
      : null

    const emptyBatches = fillable.filter(b => b._count.students / b.capacity! < 0.4)
    const star = [...table].sort((a, b) => b.active - a.active)[0]

    return {
      kpis: [
        { key: 'courses', label: 'Courses Running', value: activeCourses.length, format: 'int', caption: `${table.length} in catalog` },
        { key: 'enrollments', label: 'Active Enrollments', value: totalActive, format: 'int' },
        { key: 'runRate', label: 'Monthly Run-Rate', value: runRate, format: 'inr', caption: 'monthly-fee courses' },
        { key: 'batches', label: 'Batches', value: batches.length, format: 'int' },
        { key: 'avgFill', label: 'Avg Batch Fill', value: avgFill, format: 'pct' }
      ],
      insight:
        emptyBatches.length > 0
          ? `${emptyBatches.length} batch${emptyBatches.length === 1 ? ' runs' : 'es run'} below 40% fill — merge or re-market before adding new ones.`
          : star && star.active > 0
            ? `"${star.course}" is the strongest course with ${star.active} active enrollments.`
            : null,
      charts: {
        courses: table
          .filter(c => c.active > 0)
          .slice(0, 10)
          .map(c => ({ course: c.course, students: c.active })),
        batches: batches
          .filter(b => b.capacity || b._count.students > 0)
          .map(b => ({
            grade: b.name, // reuses CapacityBars shape
            totalSeats: b.capacity ?? b._count.students,
            filledSeats: b._count.students
          }))
      }
    }
  },

  async rows(ctx, filters) {
    const table = await courseTable(ctx, filters)
    return {
      columns: [
        { key: 'course', label: 'Course' },
        { key: 'category', label: 'Category', format: 'badge' },
        { key: 'fee', label: 'Fee' },
        { key: 'active', label: 'Active', format: 'int' },
        { key: 'paused', label: 'Paused', format: 'int' },
        { key: 'completed', label: 'Completed', format: 'int' },
        { key: 'cancelled', label: 'Cancelled', format: 'int' },
        { key: 'monthlyRunRate', label: 'Monthly Run-Rate', format: 'inr' },
        { key: 'billed', label: 'Billed (all time)', format: 'inr' },
        { key: 'collected', label: 'Collected (all time)', format: 'inr' }
      ],
      rows: table.map(({ courseId: _c, filtered: _f, ...r }) => r),
      nextCursor: null
    }
  }
}
