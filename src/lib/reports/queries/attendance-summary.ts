import { ReportQuery, ReportCtx, Filters, rangeFilter, listFilter } from './types'
import { ayScope, branchScope, effectiveBranchIds } from './scope'

// Monthly attendance summary per class (grade+section) or, for records
// marked against sessions, per course/batch. Defaults to the current month.

function recordWhere(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const grades = listFilter(filters.grade)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(effectiveBranchIds(ctx.branchIds, filters.branch)),
    date: range ?? { gte: startOfMonth },
    ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
  }
}

type Bucket = {
  label: string
  present: number
  absent: number
  halfDay: number
  leave: number
  days: Set<string>
}

async function buildBuckets(ctx: ReportCtx, filters: Filters): Promise<Bucket[]> {
  const records = await ctx.db.attendanceRecord.findMany({
    where: recordWhere(ctx, filters),
    select: {
      date: true,
      status: true,
      student: { select: { gradeLabel: true, section: true } },
      session: { select: { title: true, course: { select: { name: true } }, batch: { select: { name: true } } } }
    },
    take: 100_000
  })

  const buckets = new Map<string, Bucket>()
  for (const r of records) {
    if (r.status === 'HOLIDAY') continue
    const label = r.session
      ? r.session.course?.name ?? r.session.batch?.name ?? r.session.title ?? 'Session'
      : [r.student.gradeLabel ?? 'Unassigned', r.student.section].filter(Boolean).join(' — ')
    let b = buckets.get(label)
    if (!b) {
      b = { label, present: 0, absent: 0, halfDay: 0, leave: 0, days: new Set() }
      buckets.set(label, b)
    }
    if (r.status === 'PRESENT') b.present++
    else if (r.status === 'ABSENT') b.absent++
    else if (r.status === 'HALF_DAY') b.halfDay++
    else if (r.status === 'LEAVE') b.leave++
    b.days.add(r.date.toISOString().slice(0, 10))
  }
  return [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label))
}

const pctOf = (b: Bucket): number | null => {
  const marked = b.present + b.absent + b.halfDay + b.leave
  return marked > 0 ? Math.round(((b.present + 0.5 * b.halfDay) / marked) * 1000) / 10 : null
}

export const attendanceSummary: ReportQuery = {
  async summary(ctx, filters) {
    const buckets = await buildBuckets(ctx, filters)
    const total = buckets.reduce(
      (acc, b) => ({
        present: acc.present + b.present,
        absent: acc.absent + b.absent,
        halfDay: acc.halfDay + b.halfDay,
        leave: acc.leave + b.leave
      }),
      { present: 0, absent: 0, halfDay: 0, leave: 0 }
    )
    const marked = total.present + total.absent + total.halfDay + total.leave
    const pct = marked > 0 ? Math.round(((total.present + 0.5 * total.halfDay) / marked) * 1000) / 10 : null
    const worst = buckets
      .map(b => ({ label: b.label, pct: pctOf(b) }))
      .filter(b => b.pct != null)
      .sort((a, b) => a.pct! - b.pct!)[0]

    return {
      kpis: [
        { key: 'classes', label: 'Classes / Groups', value: buckets.length, format: 'int' },
        { key: 'pct', label: 'Overall Attendance', value: pct, format: 'pct' },
        { key: 'present', label: 'Present Marks', value: total.present, format: 'int' },
        { key: 'absent', label: 'Absent Marks', value: total.absent, format: 'int' }
      ],
      insight:
        worst && worst.pct! < 75
          ? `${worst.label} has the lowest attendance at ${worst.pct}% — below the 75% line.`
          : null,
      charts: {
        byClass: buckets.map(b => ({ label: b.label, pct: pctOf(b) ?? 0 }))
      }
    }
  },

  async rows(ctx, filters) {
    const buckets = await buildBuckets(ctx, filters)
    return {
      columns: [
        { key: 'label', label: 'Class / Group' },
        { key: 'workingDays', label: 'Marked Days', format: 'int' },
        { key: 'present', label: 'Present', format: 'int' },
        { key: 'absent', label: 'Absent', format: 'int' },
        { key: 'halfDay', label: 'Half Days', format: 'int' },
        { key: 'leave', label: 'Leave', format: 'int' },
        { key: 'pct', label: 'Attendance %', format: 'pct' }
      ],
      rows: buckets.map(b => ({
        label: b.label,
        workingDays: b.days.size,
        present: b.present,
        absent: b.absent,
        halfDay: b.halfDay,
        leave: b.leave,
        pct: pctOf(b)
      })),
      nextCursor: null
    }
  }
}
