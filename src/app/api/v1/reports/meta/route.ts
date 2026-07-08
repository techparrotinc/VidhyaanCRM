import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { reportsForRole, REPORTS_MODULE_SLUG } from '@/lib/reports/registry'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

// Registry entries visible to the caller's role. Drives the Library page and
// per-report filter bars — the frontend hard-codes no report definitions.
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ user }) => {
    return ok(reportsForRole(user.role))
  }
})
