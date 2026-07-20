import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { canManageSlot, TIMETABLE_ADMIN_ROLES, TIMETABLE_MANAGE_ROLES } from '@/lib/timetable'
import { ROLES } from '@/constants/roles'

// Swap two periods: exchange their subject + teacher + room, leaving each in
// its own day/time. Models "trade Monday P1 with Tuesday P3" / substitution.
// Admins swap any pair; a teacher must own at least one of the two slots.
const bodySchema = z.object({
  slotAId: z.string().min(1),
  slotBId: z.string().min(1)
})

export const POST = route({
  roles: TIMETABLE_MANAGE_ROLES,
  handler: async ({ req, db, user }) => {
    const body = bodySchema.parse(await req.json())
    if (body.slotAId === body.slotBId) throw Errors.validation({ slotBId: ['Pick two different periods'] })

    const [a, b] = await Promise.all([
      db.timetableSlot.findFirst({ where: { id: body.slotAId } }),
      db.timetableSlot.findFirst({ where: { id: body.slotBId } })
    ])
    if (!a || !b) throw Errors.notFound('Timetable slot not found')

    const isAdmin = TIMETABLE_ADMIN_ROLES.includes(user.role as any)
    const ownsOne =
      user.role === ROLES.TEACHER && (canManageSlot(user, a) || canManageSlot(user, b))
    if (!isAdmin && !ownsOne) {
      throw Errors.forbidden('You can only swap a period you teach')
    }

    await db.$transaction([
      db.timetableSlot.update({
        where: { id: a.id },
        data: { subject: b.subject, teacherId: b.teacherId, room: b.room }
      }),
      db.timetableSlot.update({
        where: { id: b.id },
        data: { subject: a.subject, teacherId: a.teacherId, room: a.room }
      })
    ])

    return ok({ swapped: true, slotAId: a.id, slotBId: b.id })
  }
})
