import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'

export const DELETE = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    const assignment = await db.teacherAssignment.findUnique({ where: { id } })
    if (!assignment) throw Errors.notFound('Assignment')
    await db.teacherAssignment.delete({ where: { id } })
    return ok({ deleted: true })
  }
})
