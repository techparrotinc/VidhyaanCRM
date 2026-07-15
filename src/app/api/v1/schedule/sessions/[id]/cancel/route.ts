import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { SCHEDULE_READ_ROLES, assertCanManage } from '@/lib/schedule/access'
import { assertCancellable } from '@/lib/schedule/transitions'
import { notifyClassCancelled } from '@/lib/schedule/notify'

const cancelSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  notifyGuardians: z.boolean().default(true)
})

export const POST = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_READ_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = params?.id
    assertCanManage(user)
    const body = cancelSchema.parse(await req.json())

    const session = await db.courseSession.findUnique({ where: { id } })
    if (!session || session.deletedAt) throw Errors.notFound('Session')
    assertCancellable(session.status)

    const updated = await db.courseSession.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: body.reason }
    })

    if (body.notifyGuardians) {
      notifyClassCancelled(db, user.orgId, updated, body.reason).catch(err =>
        console.error('Class cancel notify:', err)
      )
    }

    return ok({ session: updated })
  }
})
