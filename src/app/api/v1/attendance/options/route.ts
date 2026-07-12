import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { getTeacherAssignments, ATTENDANCE_ADMIN_ROLES } from '@/lib/attendance/access'
import { GRADE_LABEL_OPTIONS } from '@/constants/grades'

/** Canonical ladder order (Pre-KG … Class 12); unknown labels after, A→Z. */
function sortGrades(grades: string[]): string[] {
  const ladder = new Map(GRADE_LABEL_OPTIONS.map((label, i) => [label.toLowerCase(), i]))
  return grades.sort((a, b) => {
    const ia = ladder.get(a.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
    const ib = ladder.get(b.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
    return ia !== ib ? ia - ib : a.localeCompare(b)
  })
}

/** Filter option lists for the register page (grade/section/course/batch). */
export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER],
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      source: z.enum(['grades', 'sections', 'courses', 'batches']),
      gradeLabel: textParam
    })

    const isAdmin = ATTENDANCE_ADMIN_ROLES.includes(user.role)
    const assignments = isAdmin ? null : await getTeacherAssignments(db, user.id)

    if (q.source === 'grades') {
      // Master-first: defined classes appear even before any student is
      // assigned; legacy free-text grades stay reachable via the union.
      const [masterClasses, rows] = await Promise.all([
        db.schoolClass.findMany({
          where: { deletedAt: null, isActive: true },
          select: { name: true }
        }),
        db.student.groupBy({
          by: ['gradeLabel'],
          where: { deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } }
        })
      ])
      const seen = new Set<string>()
      const union: string[] = []
      for (const name of [...masterClasses.map(m => m.name), ...rows.map(r => r.gradeLabel as string)]) {
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          union.push(name)
        }
      }
      let grades = sortGrades(union)
      if (assignments) {
        const allowed = new Set(
          assignments.filter(a => a.gradeLabel).map(a => a.gradeLabel!.toLowerCase())
        )
        grades = grades.filter(g => allowed.has(g.toLowerCase()))
      }
      return ok({ options: grades })
    }

    if (q.source === 'sections') {
      const [masterSections, rows] = await Promise.all([
        q.gradeLabel
          ? db.classSection.findMany({
              where: {
                isActive: true,
                schoolClass: {
                  deletedAt: null,
                  name: { equals: q.gradeLabel, mode: 'insensitive' }
                }
              },
              select: { name: true }
            })
          : Promise.resolve([] as { name: string }[]),
        db.student.groupBy({
          by: ['section'],
          where: {
            deletedAt: null,
            status: 'ACTIVE',
            section: { not: null },
            ...(q.gradeLabel ? { gradeLabel: { equals: q.gradeLabel, mode: 'insensitive' } } : {})
          }
        })
      ])
      const seen = new Set<string>()
      let sections: string[] = []
      for (const name of [...masterSections.map(m => m.name), ...rows.map(r => r.section as string)]) {
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          sections.push(name)
        }
      }
      sections.sort()
      if (assignments && q.gradeLabel) {
        const forGrade = assignments.filter(
          a => a.gradeLabel?.toLowerCase() === q.gradeLabel!.toLowerCase()
        )
        // An assignment without a section covers all sections of the grade.
        if (!forGrade.some(a => !a.section)) {
          const allowed = new Set(forGrade.map(a => (a.section ?? '').toLowerCase()))
          sections = sections.filter(s => allowed.has(s.toLowerCase()))
        }
      }
      return ok({ options: sections })
    }

    if (q.source === 'courses') {
      const where: any = { deletedAt: null, isActive: true }
      if (assignments) {
        where.id = { in: assignments.map(a => a.courseId).filter(Boolean) as string[] }
      }
      const courses = await db.course.findMany({
        where,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
      return ok({ options: courses })
    }

    const where: any = { deletedAt: null }
    if (assignments) {
      where.id = { in: assignments.map(a => a.batchId).filter(Boolean) as string[] }
    }
    const batches = await db.studentBatch.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
    return ok({ options: batches })
  }
})
