import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { GRADE_LABEL_OPTIONS } from '@/constants/grades'
import { DATE_RE, toDbDate, isWorkingDay } from '@/lib/attendance/dates'
import { resolveAttendanceSettings } from '@/lib/attendance/settings'
import { getTeacherAssignments, ATTENDANCE_ADMIN_ROLES } from '@/lib/attendance/access'

// One card per (gradeLabel, section) pair with roster size + mark progress
// for the day — the register page's landing grid. Teacher role sees only
// assigned pairs.

const ladder = new Map(GRADE_LABEL_OPTIONS.map((label, i) => [label.toLowerCase(), i]))

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER],
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      date: z.string().regex(DATE_RE, 'Expected YYYY-MM-DD')
    })
    const date = toDbDate(q.date)

    const [pairs, masterClasses, dayRecords, org, holiday] = await Promise.all([
      db.student.groupBy({
        by: ['gradeLabel', 'section'],
        where: { deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } },
        _count: { _all: true }
      }),
      db.schoolClass.findMany({
        where: { deletedAt: null, isActive: true },
        select: { name: true, sections: { where: { isActive: true }, select: { name: true } } }
      }),
      db.attendanceRecord.findMany({
        where: { date, sessionKey: 'DAY' },
        select: {
          status: true,
          student: { select: { gradeLabel: true, section: true } }
        }
      }),
      db.organization.findUnique({ where: { id: user.orgId }, select: { settings: true } }),
      db.holiday.findFirst({ where: { date } })
    ])

    const keyOf = (g: string | null, s: string | null) =>
      `${(g ?? '').toLowerCase()}|${(s ?? '').toLowerCase()}`

    const progress = new Map<string, { marked: number; present: number; absent: number }>()
    for (const r of dayRecords) {
      const key = keyOf(r.student.gradeLabel, r.student.section)
      let p = progress.get(key)
      if (!p) {
        p = { marked: 0, present: 0, absent: 0 }
        progress.set(key, p)
      }
      if (r.status !== 'HOLIDAY') p.marked++
      if (r.status === 'PRESENT' || r.status === 'HALF_DAY') p.present++
      if (r.status === 'ABSENT') p.absent++
    }

    let classes = pairs.map(p => {
      const prog = progress.get(keyOf(p.gradeLabel, p.section))
      return {
        gradeLabel: p.gradeLabel as string,
        section: p.section,
        students: p._count._all,
        marked: prog?.marked ?? 0,
        present: prog?.present ?? 0,
        absent: prog?.absent ?? 0
      }
    })

    // Union with the class master so defined-but-empty classes/sections show
    // up as cards (student counts stay string-derived).
    const covered = new Set(classes.map(c => keyOf(c.gradeLabel, c.section)))
    for (const m of masterClasses) {
      const sectionNames = m.sections.length > 0 ? m.sections.map(s => s.name) : [null]
      for (const sec of sectionNames) {
        if (covered.has(keyOf(m.name, sec))) continue
        covered.add(keyOf(m.name, sec))
        classes.push({
          gradeLabel: m.name,
          section: sec,
          students: 0,
          marked: 0,
          present: 0,
          absent: 0
        })
      }
    }

    if (!ATTENDANCE_ADMIN_ROLES.includes(user.role)) {
      const assignments = await getTeacherAssignments(db, user.id)
      classes = classes.filter(c =>
        assignments.some(
          a =>
            a.gradeLabel?.toLowerCase() === c.gradeLabel.toLowerCase() &&
            (!a.section || a.section.toLowerCase() === (c.section ?? '').toLowerCase())
        )
      )
    }

    classes.sort((a, b) => {
      const ia = ladder.get(a.gradeLabel.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
      const ib = ladder.get(b.gradeLabel.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      const g = a.gradeLabel.localeCompare(b.gradeLabel)
      if (g !== 0) return g
      return (a.section ?? '').localeCompare(b.section ?? '')
    })

    const settings = resolveAttendanceSettings(org?.settings)
    return ok({
      classes,
      holiday: holiday ? { name: holiday.name } : null,
      isWorkingDay: isWorkingDay(q.date, settings.workingDays)
    })
  }
})
