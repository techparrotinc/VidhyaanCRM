import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { REPORTS_MODULE_SLUG, getReport } from '@/lib/reports/registry'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

const putSchema = z.object({
  favourite: z.boolean().optional(),
  viewed: z.boolean().optional()
})

// PUT /usage/{reportKey} — toggle favourite and/or record a view.
// The frontend calls { viewed: true } on report open.
export const PUT = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db, params }) => {
    const reportKey = params?.reportKey ?? ''
    const report = getReport(reportKey)
    if (!report || !report.allowedRoles.includes(user.role)) {
      throw Errors.notFound('Report')
    }
    const body = putSchema.parse(await req.json())

    const usage = await db.reportUsage.upsert({
      where: { userId_reportKey: { userId: user.id, reportKey } },
      create: {
        orgId: user.orgId,
        userId: user.id,
        reportKey,
        isFavourite: body.favourite ?? false,
        lastViewedAt: body.viewed ? new Date() : null,
        viewCount: body.viewed ? 1 : 0
      },
      update: {
        ...(body.favourite !== undefined ? { isFavourite: body.favourite } : {}),
        ...(body.viewed
          ? { lastViewedAt: new Date(), viewCount: { increment: 1 } }
          : {})
      }
    })
    return ok(usage)
  }
})
