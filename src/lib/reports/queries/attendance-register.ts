import { ReportQuery, ReportCtx, Filters, rangeFilter, listFilter, offsetCursor, nextOffsetCursor } from './types'
import { ayScope, branchScope, effectiveBranchIds } from './scope'

// Daily absence register — who was absent/on leave, marked by whom.
// Defaults to today when no range picked.

function recordWhere(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const grades = listFilter(filters.grade)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(effectiveBranchIds(ctx.branchIds, filters.branch)),
    date: range ?? { gte: startOfToday },
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
  }
}

export const attendanceRegister: ReportQuery = {
  async summary(ctx, filters) {
    const byStatus = await ctx.db.attendanceRecord.groupBy({
      by: ['status'],
      where: recordWhere(ctx, filters),
      _count: { _all: true }
    })
    const count = (s: string) => byStatus.find(b => b.status === s)?._count._all ?? 0
    const present = count('PRESENT')
    const absent = count('ABSENT')
    const halfDay = count('HALF_DAY')
    const leave = count('LEAVE')
    const marked = present + absent + halfDay + leave
    const pct = marked > 0 ? Math.round(((present + 0.5 * halfDay) / marked) * 1000) / 10 : null

    return {
      kpis: [
        { key: 'marked', label: 'Marked', value: marked, format: 'int' },
        { key: 'present', label: 'Present', value: present, format: 'int' },
        { key: 'absent', label: 'Absent', value: absent, format: 'int' },
        { key: 'leave', label: 'On Leave', value: leave, format: 'int' },
        { key: 'pct', label: 'Attendance %', value: pct, format: 'pct' }
      ],
      insight:
        absent > 0 && marked > 0 && absent / marked > 0.15
          ? `${absent} absences (${Math.round((absent / marked) * 100)}% of marked students) in this period — above the 15% attention line.`
          : null,
      charts: {
        byStatus: byStatus.map(b => ({ status: b.status, count: b._count._all }))
      }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const records = await ctx.db.attendanceRecord.findMany({
      where: recordWhere(ctx, filters),
      include: {
        student: { select: { name: true, studentCode: true, gradeLabel: true, section: true } },
        session: { select: { title: true, course: { select: { name: true } }, batch: { select: { name: true } } } },
        markedBy: { select: { name: true } }
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit
    })

    return {
      columns: [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'student', label: 'Student' },
        { key: 'classOrSession', label: 'Class / Session' },
        { key: 'status', label: 'Status', format: 'badge' },
        { key: 'source', label: 'Source' },
        { key: 'note', label: 'Note' },
        { key: 'markedBy', label: 'Marked By' }
      ],
      rows: records.map(r => ({
        date: r.date.toISOString().slice(0, 10),
        student: `${r.student.name} (${r.student.studentCode})`,
        classOrSession:
          r.session?.title ??
          r.session?.course?.name ??
          r.session?.batch?.name ??
          [r.student.gradeLabel, r.student.section].filter(Boolean).join(' — '),
        status: r.status,
        source: r.source,
        note: r.note ?? '',
        markedBy: r.markedBy?.name ?? (r.source === 'BIOMETRIC' ? 'Biometric device' : '')
      })),
      nextCursor: nextOffsetCursor(offset, limit, records.length)
    }
  }
}
