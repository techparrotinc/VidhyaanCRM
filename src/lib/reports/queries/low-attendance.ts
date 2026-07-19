import { ReportQuery, ReportCtx, Filters, rangeFilter, listFilter } from './types'
import { ayScope, branchScope, effectiveBranchIds } from './scope'

// Students whose attendance percentage falls below a threshold (default 75%).
// Defaults to the current month when no range picked.

const DEFAULT_THRESHOLD = 75

function recordWhere(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const grades = listFilter(filters.grade)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(effectiveBranchIds(ctx.branchIds, filters.branch)),
    date: range ?? { gte: startOfMonth },
    status: { not: 'HOLIDAY' as never },
    ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
  }
}

type StudentRow = {
  studentId: string
  name: string
  studentCode: string
  gradeLabel: string | null
  section: string | null
  guardianPhone: string | null
  present: number
  absent: number
  halfDay: number
  leave: number
  pct: number
}

async function lowAttendanceRows(ctx: ReportCtx, filters: Filters): Promise<StudentRow[]> {
  const threshold = Number(filters.threshold) || DEFAULT_THRESHOLD
  const grouped = await ctx.db.attendanceRecord.groupBy({
    by: ['studentId', 'status'],
    where: recordWhere(ctx, filters),
    _count: { _all: true }
  })

  const perStudent = new Map<string, { present: number; absent: number; halfDay: number; leave: number }>()
  for (const g of grouped) {
    let s = perStudent.get(g.studentId)
    if (!s) {
      s = { present: 0, absent: 0, halfDay: 0, leave: 0 }
      perStudent.set(g.studentId, s)
    }
    if (g.status === 'PRESENT') s.present = g._count._all
    else if (g.status === 'ABSENT') s.absent = g._count._all
    else if (g.status === 'HALF_DAY') s.halfDay = g._count._all
    else if (g.status === 'LEAVE') s.leave = g._count._all
  }

  const low: { studentId: string; counts: { present: number; absent: number; halfDay: number; leave: number }; pct: number }[] = []
  for (const [studentId, c] of perStudent) {
    const marked = c.present + c.absent + c.halfDay + c.leave
    if (marked === 0) continue
    const pct = Math.round(((c.present + 0.5 * c.halfDay) / marked) * 1000) / 10
    if (pct < threshold) low.push({ studentId, counts: c, pct })
  }
  low.sort((a, b) => a.pct - b.pct)

  const students = await ctx.db.student.findMany({
    where: { id: { in: low.map(l => l.studentId) } },
    select: { id: true, name: true, studentCode: true, gradeLabel: true, section: true, guardianPhone: true }
  })
  const byId = new Map(students.map(s => [s.id, s]))

  return low
    .map(l => {
      const s = byId.get(l.studentId)
      if (!s) return null
      return {
        studentId: l.studentId,
        name: s.name,
        studentCode: s.studentCode,
        gradeLabel: s.gradeLabel,
        section: s.section,
        guardianPhone: s.guardianPhone,
        ...l.counts,
        pct: l.pct
      }
    })
    .filter((r): r is StudentRow => r !== null)
}

export const lowAttendance: ReportQuery = {
  async summary(ctx, filters) {
    const threshold = Number(filters.threshold) || DEFAULT_THRESHOLD
    const rows = await lowAttendanceRows(ctx, filters)
    const critical = rows.filter(r => r.pct < 50).length

    return {
      kpis: [
        { key: 'below', label: `Below ${threshold}%`, value: rows.length, format: 'int' },
        { key: 'critical', label: 'Below 50%', value: critical, format: 'int' },
        {
          key: 'lowest',
          label: 'Lowest',
          value: rows[0] ? `${rows[0].name} (${rows[0].pct}%)` : '—',
          format: 'text'
        }
      ],
      insight:
        rows.length > 0
          ? `${rows.length} student${rows.length === 1 ? '' : 's'} below ${threshold}% attendance — consider guardian outreach.`
          : null,
      charts: {}
    }
  },

  async rows(ctx, filters) {
    const rows = await lowAttendanceRows(ctx, filters)
    return {
      columns: [
        { key: 'student', label: 'Student' },
        { key: 'class', label: 'Class' },
        { key: 'pct', label: 'Attendance %', format: 'pct' },
        { key: 'present', label: 'Present', format: 'int' },
        { key: 'absent', label: 'Absent', format: 'int' },
        { key: 'leave', label: 'Leave', format: 'int' },
        { key: 'guardianPhone', label: 'Guardian Phone' }
      ],
      rows: rows.slice(0, 500).map(r => ({
        __href: `/student-management/${r.studentId}`,
        student: `${r.name} (${r.studentCode})`,
        class: [r.gradeLabel, r.section].filter(Boolean).join(' — '),
        pct: r.pct,
        present: r.present,
        absent: r.absent,
        leave: r.leave,
        guardianPhone: r.guardianPhone ?? ''
      })),
      nextCursor: null
    }
  }
}
