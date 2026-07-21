import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES, ORG_ROLES } from '@/constants/roles'
import { parseQuery, textParam } from '@/lib/api/query'
import { slotSchema, normalizeSlot, assertNoOverlap } from '@/lib/timetable'
import { DATE_RE } from '@/lib/schedule/dates'
import { syncSlotTeacherAssignment } from '@/lib/attendance/sync-teacher-assignment'

// Weekly class timetable. Structural academic config like the class/section
// master — role-gated, not module-gated. Grade/section stored as strings
// matching Student.gradeLabel/section; the class master drives the pickers.

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

// Two lenses on the same slots: BY CLASS (gradeLabel[+section]) or BY TEACHER
// (teacherId → that teacher's periods across every class/section). When a
// weekStart (Monday) is given, each slot is tagged with its one-off
// cancellation for that specific week's date, if any.
export const GET = route({
  roles: [...ORG_ROLES], // teachers get read access
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      gradeLabel: textParam,
      section: textParam,
      teacherId: textParam,
      weekStart: z.string().regex(DATE_RE).optional()
    })

    // Teachers default to their own timetable when no explicit target is set.
    const teacherId =
      q.teacherId || (!q.gradeLabel && user.role === ROLES.TEACHER ? user.id : undefined)

    if (!q.gradeLabel && !teacherId) {
      return ok({ slots: [] }) // nothing selected yet
    }

    const sectionKey = q.section?.trim() || null
    const where: any = teacherId
      ? { teacherId }
      : {
          gradeLabel: q.gradeLabel,
          ...(sectionKey ? { sectionKey: { in: [sectionKey, 'ALL'] } } : {})
        }

    const slots = await db.timetableSlot.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { teacher: { select: { id: true, name: true } } }
    })

    // One-off (per-date) cancellations for the selected week.
    let exceptionBySlotDate = new Map<string, { date: string; reason: string | null }>()
    if (q.weekStart && slots.length > 0) {
      const weekEnd = new Date(`${q.weekStart}T00:00:00.000Z`)
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
      const exceptions = await db.timetableException.findMany({
        where: {
          slotId: { in: slots.map(s => s.id) },
          date: { gte: new Date(`${q.weekStart}T00:00:00.000Z`), lt: weekEnd }
        },
        select: { slotId: true, date: true, reason: true }
      })
      exceptionBySlotDate = new Map(
        exceptions.map(e => [e.slotId, { date: e.date.toISOString().slice(0, 10), reason: e.reason }])
      )
    }

    return ok({
      slots: slots.map(s => ({
        ...s,
        canManage:
          ADMIN_ROLES.includes(user.role as any) ||
          (user.role === ROLES.TEACHER && s.teacherId === user.id),
        dateCancelled: exceptionBySlotDate.get(s.id) ?? null
      }))
    })
  }
})

export const POST = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const body = normalizeSlot(slotSchema.parse(await req.json()))
    await assertNoOverlap(db, body)

    const slot = await db.timetableSlot.create({
      data: {
        orgId: user.orgId,
        gradeLabel: body.gradeLabel,
        section: body.section,
        sectionKey: body.sectionKey,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        subject: body.subject,
        teacherId: body.teacherId,
        room: body.room
      },
      include: { teacher: { select: { id: true, name: true } } }
    })
    // Grant the period's teacher attendance-marking scope for this grade/section.
    await syncSlotTeacherAssignment(db, {
      orgId: user.orgId,
      teacherId: slot.teacherId,
      gradeLabel: slot.gradeLabel,
      section: slot.section
    })
    return created({ slot })
  }
})
