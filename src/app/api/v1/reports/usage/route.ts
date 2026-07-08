import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { REPORTS_MODULE_SLUG, isValidReportKey } from '@/lib/reports/registry'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

// Favourites + recently viewed for the Library page. Stale keys (report
// removed from the registry) are filtered out rather than surfaced.
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ user, db }) => {
    const usage = await db.reportUsage.findMany({
      where: { userId: user.id },
      orderBy: { lastViewedAt: 'desc' }
    })
    const valid = usage.filter(u => isValidReportKey(u.reportKey))
    return ok({
      favourites: valid.filter(u => u.isFavourite).map(u => u.reportKey),
      recent: valid
        .filter(u => u.lastViewedAt !== null)
        .slice(0, 8)
        .map(u => ({ reportKey: u.reportKey, lastViewedAt: u.lastViewedAt }))
    })
  }
})
