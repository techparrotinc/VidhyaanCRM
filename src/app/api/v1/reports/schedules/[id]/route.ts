import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { CADENCE_TOKENS } from '@/lib/reports/schedule'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

const patchSchema = z.object({
  cadence: z.enum(CADENCE_TOKENS).optional(),
  recipients: z.array(z.string().email()).min(1).max(5).optional(),
  enabled: z.boolean().optional()
})

export const PATCH = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db, params }) => {
    const body = patchSchema.parse(await req.json())
    const schedule = await db.reportSchedule.findFirst({
      where: { id: params?.id, userId: user.id }
    })
    if (!schedule) throw Errors.notFound('Schedule')

    const updated = await db.reportSchedule.update({
      where: { id: schedule.id },
      data: {
        ...(body.cadence !== undefined ? { cadence: body.cadence } : {}),
        ...(body.recipients !== undefined ? { recipients: body.recipients } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {})
      }
    })
    return ok(updated)
  }
})

export const DELETE = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ user, db, params }) => {
    const schedule = await db.reportSchedule.findFirst({
      where: { id: params?.id, userId: user.id }
    })
    if (!schedule) throw Errors.notFound('Schedule')
    await db.reportSchedule.delete({ where: { id: schedule.id } })
    return ok({ deleted: true })
  }
})
