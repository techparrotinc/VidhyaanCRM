import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { redis } from '@/lib/redis'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { reportRequest } from '@/lib/reports/route-helpers'
import { createHash } from 'crypto'

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

    // 300s cache; key spans filters + row-scope inputs so a counsellor's
    // scoped numbers never leak into an admin's view (and vice versa).
    const hash = createHash('sha1')
      .update(JSON.stringify({ filters, ay: ctx.academicYearId, br: ctx.branchIds, scope: ctx.role === 'COUNSELLOR' ? ctx.userId : 'org' }))
      .digest('hex')
      .slice(0, 16)
    const cacheKey = `rpt:sum:${user.orgId}:${params?.reportKey}:${hash}`
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) return ok(JSON.parse(cached))

    const result = await query.summary(ctx, filters)
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300).catch(() => {})
    return ok(result)
  }
})
