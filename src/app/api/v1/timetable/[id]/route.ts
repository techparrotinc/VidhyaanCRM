import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { slotSchema, normalizeSlot, assertNoOverlap } from '@/lib/timetable'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

export const PATCH = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Timetable slot not found')
    const existing = await db.timetableSlot.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Timetable slot not found')

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

export const DELETE = route({
  roles: ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Timetable slot not found')
    const existing = await db.timetableSlot.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Timetable slot not found')
    await db.timetableSlot.delete({ where: { id } })
    return ok({ deleted: true })
  }
})
