import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import {
  slotSchema,
  normalizeSlot,
  assertNoOverlap,
  canManageSlot,
  TIMETABLE_ADMIN_ROLES,
  TIMETABLE_MANAGE_ROLES
} from '@/lib/timetable'

// Edit a period (incl. in-place subject change). Admins edit any slot; a
// teacher may edit their OWN periods only.
export const PATCH = route({
  roles: TIMETABLE_MANAGE_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Timetable slot not found')
    const existing = await db.timetableSlot.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Timetable slot not found')
    if (!canManageSlot(user, existing)) {
      throw Errors.forbidden('You can only edit your own periods')
    }

    const body = normalizeSlot(slotSchema.parse(await req.json()))
    await assertNoOverlap(db, body, id)

    const slot = await db.timetableSlot.update({
      where: { id },
      data: {
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
    return ok({ slot })
  }
})

// Hard delete stays admin-only — cancel (recurring/one-off) is the teacher path.
export const DELETE = route({
  roles: TIMETABLE_ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Timetable slot not found')
    const existing = await db.timetableSlot.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Timetable slot not found')
    await db.timetableSlot.delete({ where: { id } })
    return ok({ deleted: true })
  }
})
