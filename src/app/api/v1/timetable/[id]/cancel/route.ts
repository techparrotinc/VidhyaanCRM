import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { DATE_RE } from '@/lib/schedule/dates'
import { canManageSlot, TIMETABLE_MANAGE_ROLES } from '@/lib/timetable'

// Cancel a period, two scopes:
//  - recurring: the whole period stops running (cancelledAt set); restore clears it.
//  - date: just one date is cancelled (a TimetableException row); restore removes it.
// Admins act on any slot; a teacher on their own periods only.
const bodySchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('recurring'), reason: z.string().trim().max(300).optional(), restore: z.boolean().optional() }),
  z.object({ scope: z.literal('date'), date: z.string().regex(DATE_RE), reason: z.string().trim().max(300).optional(), restore: z.boolean().optional() })
])

export const POST = route({
  roles: TIMETABLE_MANAGE_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Timetable slot not found')
    const slot = await db.timetableSlot.findFirst({ where: { id } })
    if (!slot) throw Errors.notFound('Timetable slot not found')
    if (!canManageSlot(user, slot)) {
      throw Errors.forbidden('You can only cancel your own periods')
    }

    const body = bodySchema.parse(await req.json())

    if (body.scope === 'recurring') {
      const updated = await db.timetableSlot.update({
        where: { id },
        data: body.restore
          ? { cancelledAt: null, cancelReason: null, cancelledById: null }
          : { cancelledAt: new Date(), cancelReason: body.reason ?? null, cancelledById: user.id }
      })
      return ok({ scope: 'recurring', cancelled: !body.restore, slotId: updated.id })
    }

    // One-off date cancel/restore.
    const date = new Date(`${body.date}T00:00:00.000Z`)
    if (body.restore) {
      await db.timetableException.deleteMany({ where: { slotId: id, date } })
      return ok({ scope: 'date', cancelled: false, date: body.date })
    }
    await db.timetableException.upsert({
      where: { slotId_date: { slotId: id, date } },
      create: { orgId: user.orgId, slotId: id, date, reason: body.reason ?? null, createdById: user.id },
      update: { reason: body.reason ?? null, createdById: user.id }
    })
    return ok({ scope: 'date', cancelled: true, date: body.date })
  }
})
