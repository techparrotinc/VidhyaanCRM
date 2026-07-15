import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { SCHEDULE_READ_ROLES, assertCanAct } from '@/lib/schedule/access'
import { assertRemindable } from '@/lib/schedule/transitions'
import { notifyClassReminder } from '@/lib/schedule/notify'

export const POST = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_READ_ROLES,
  handler: async ({ db, user, params }) => {
    const id = params?.id
    const session = await db.courseSession.findUnique({ where: { id } })
    if (!session || session.deletedAt) throw Errors.notFound('Session')
    await assertCanAct(db, user, session)

    assertRemindable(session.status)

    const sent = await notifyClassReminder(db, user.orgId, session)
    return ok({ sent })
  }
})
