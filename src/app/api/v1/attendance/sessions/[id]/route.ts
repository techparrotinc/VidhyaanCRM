import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { DATE_RE, toDbDate } from '@/lib/attendance/dates'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const patchSchema = z.object({
  date: z.string().regex(DATE_RE).optional(),
  title: z.string().max(200).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  deliveryMode: z.enum(['IN_PERSON', 'ONLINE']).optional()
})

export const PATCH = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ req, db, params }) => {
    const id = (await params)?.id
    const body = patchSchema.parse(await req.json())
    const existing = await db.attendanceSession.findUnique({ where: { id } })
    if (!existing) throw Errors.notFound('Session')

    const session = await db.attendanceSession.update({
      where: { id },
      data: {
        ...(body.date ? { date: toDbDate(body.date) } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.startsAt !== undefined ? { startsAt: body.startsAt } : {}),
        ...(body.endsAt !== undefined ? { endsAt: body.endsAt } : {}),
        ...(body.deliveryMode ? { deliveryMode: body.deliveryMode } : {})
      }
    })
    return ok({ session })
  }
})

export const DELETE = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    const existing = await db.attendanceSession.findUnique({ where: { id } })
    if (!existing) throw Errors.notFound('Session')
    await db.attendanceSession.delete({ where: { id } }) // cascades records
    return ok({ deleted: true })
  }
})
