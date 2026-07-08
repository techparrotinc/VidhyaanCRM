import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { parseQuery, limitParam, textParam } from '@/lib/api/query'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { reportRequest } from '@/lib/reports/route-helpers'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db, params }) => {
    const { query, ctx, filters } = await reportRequest({
      reportKey: params?.reportKey, url: req.url, db, user
    })
    const { cursor, limit } = parseQuery(req.url, { cursor: textParam, limit: limitParam })
    const result = await query.rows(ctx, filters, cursor, limit)
    return ok(result)
  }
})
