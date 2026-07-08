import { ayScope, branchScope } from './scope'
import { ReportQuery, ReportCtx, Filters, listFilter } from './types'

const EXIT_STATUSES = ['TRANSFERRED', 'DROPPED_OUT', 'ALUMNI'] as const

function whereFor(ctx: ReportCtx, filters: Filters) {
  const grades = listFilter(filters.grade)
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(ctx.branchIds),
    ...(grades ? { gradeLabel: { in: grades } } : {}),
    ...(filters.gender ? { gender: filters.gender as never } : {})
  }
}

async function gradeTable(ctx: ReportCtx, filters: Filters) {
  const where = whereFor(ctx, filters)
  const statusFilter = filters.status
    ? { status: filters.status as never }
    : { status: 'ACTIVE' as never }

  const [byGrade, byGender, sections, exits] = await Promise.all([
    ctx.db.student.groupBy({
      by: ['gradeLabel'],
      where: { ...where, ...statusFilter },
      _count: { _all: true }
    }),
    ctx.db.student.groupBy({
      by: ['gradeLabel', 'gender'],
      where: { ...where, ...statusFilter },
      _count: { _all: true }
    }),
    ctx.db.student.groupBy({
      by: ['gradeLabel', 'section'],
      where: { ...where, ...statusFilter },
      _count: { _all: true }
    }),
    ctx.db.student.groupBy({
      by: ['gradeLabel'],
      where: { ...where, status: { in: [...EXIT_STATUSES] as never[] } },
      _count: { _all: true }
    })
  ])

  const genderMap = new Map<string, { male: number; female: number }>()
  for (const r of byGender) {
    const key = r.gradeLabel ?? 'Unspecified'
    const e = genderMap.get(key) ?? { male: 0, female: 0 }
    if (r.gender === 'MALE') e.male += r._count._all
    if (r.gender === 'FEMALE') e.female += r._count._all
    genderMap.set(key, e)
  }
  const sectionMap = new Map<string, number>()
  for (const r of sections) {
    const key = r.gradeLabel ?? 'Unspecified'
    if (r.section) sectionMap.set(key, (sectionMap.get(key) ?? 0) + 1)
  }
  const exitMap = new Map(exits.map(r => [r.gradeLabel ?? 'Unspecified', r._count._all]))

  return byGrade
    .map(r => {
      const grade = r.gradeLabel ?? 'Unspecified'
      const g = genderMap.get(grade) ?? { male: 0, female: 0 }
      return {
        grade,
        students: r._count._all,
        male: g.male,
        female: g.female,
        sections: sectionMap.get(grade) ?? 0,
        exits: exitMap.get(grade) ?? 0
      }
    })
    .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }))
}

export const enrollmentStrength: ReportQuery = {
  async summary(ctx, filters) {
    const where = whereFor(ctx, filters)
    const [table, active, admitsAY, exitsAY, siblings, batches] = await Promise.all([
      gradeTable(ctx, filters),
      ctx.db.student.count({ where: { ...where, status: 'ACTIVE' } }),
      // New this year: student record stamped with the selected AY.
      ctx.academicYearId
        ? ctx.db.student.count({ where: { ...branchScope(ctx.branchIds), academicYearId: ctx.academicYearId } })
        : null,
      ctx.db.student.count({
        where: { ...where, status: { in: [...EXIT_STATUSES] as never[] } }
      }),
      ctx.db.siblingLink.count(),
      // Learning-centre lens: batch fill rates when batches exist.
      ctx.db.studentBatch.findMany({
        where: { deletedAt: null },
        select: {
          name: true, capacity: true,
          _count: { select: { students: true } }
        },
        take: 50
      })
    ])

    return {
      kpis: [
        { key: 'active', label: 'Active Students', value: active, format: 'int' },
        { key: 'admits', label: 'Joined This Year', value: admitsAY, format: 'int' },
        { key: 'exits', label: 'Exits', value: exitsAY, format: 'int' },
        { key: 'net', label: 'Net Movement', value: admitsAY !== null ? admitsAY - exitsAY : null, format: 'int' },
        { key: 'siblings', label: 'Sibling Links', value: siblings, format: 'int' }
      ],
      insight:
        admitsAY !== null && exitsAY > admitsAY
          ? `Exits (${exitsAY}) outnumber new joins (${admitsAY}) — attrition needs attention.`
          : null,
      charts: {
        grades: table.map(r => ({ grade: r.grade, students: r.students })),
        batches: batches
          .filter(b => b._count.students > 0 || b.capacity)
          .map(b => ({
            batch: b.name,
            students: b._count.students,
            capacity: b.capacity
          }))
      }
    }
  },

  async rows(ctx, filters) {
    const table = await gradeTable(ctx, filters)
    return {
      columns: [
        { key: 'grade', label: 'Grade' },
        { key: 'students', label: 'Students', format: 'int' },
        { key: 'male', label: 'Boys', format: 'int' },
        { key: 'female', label: 'Girls', format: 'int' },
        { key: 'sections', label: 'Sections', format: 'int' },
        { key: 'exits', label: 'Exits', format: 'int' }
      ],
      rows: table,
      nextCursor: null
    }
  }
}
