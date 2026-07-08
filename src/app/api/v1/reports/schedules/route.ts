import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { Errors } from '@/lib/api/errors'
import { getReport, REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { CADENCE_TOKENS } from '@/lib/reports/schedule'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

const MAX_SCHEDULES_PER_USER = 10
const MAX_RECIPIENTS = 5

export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db }) => {
    const { reportKey } = parseQuery(req.url, { reportKey: textParam })
    const schedules = await db.reportSchedule.findMany({
      where: { userId: user.id, ...(reportKey ? { reportKey } : {}) },
      orderBy: { createdAt: 'desc' }
    })
    return ok(schedules)
  }
})

const createSchema = z.object({
  reportKey: z.string().min(1).max(64),
  savedViewId: z.string().optional(),
  cadence: z.enum(CADENCE_TOKENS),
  recipients: z.array(z.string().email()).min(1).max(MAX_RECIPIENTS)
})

export const POST = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db }) => {
    const body = createSchema.parse(await req.json())

    const report = getReport(body.reportKey)
    if (!report || !report.allowedRoles.includes(user.role)) {
      throw Errors.validation({ reportKey: ['Unknown report'] })
    }

    if (body.savedViewId) {
      const view = await db.reportSavedView.findFirst({
        where: { id: body.savedViewId, userId: user.id, reportKey: body.reportKey }
      })
      if (!view) throw Errors.validation({ savedViewId: ['Saved view not found'] })
    }

    const count = await db.reportSchedule.count({ where: { userId: user.id } })
    if (count >= MAX_SCHEDULES_PER_USER) {
      throw Errors.businessRule(`Limit of ${MAX_SCHEDULES_PER_USER} schedules per user reached`)
    }

    const schedule = await db.reportSchedule.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        reportKey: body.reportKey,
        savedViewId: body.savedViewId ?? null,
        cadence: body.cadence,
        channel: 'email',
        recipients: body.recipients,
        enabled: true
      }
    })
    return created(schedule)
  }
})
