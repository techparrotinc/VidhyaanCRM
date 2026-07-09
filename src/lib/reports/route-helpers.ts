import { Errors } from '@/lib/api/errors'
import type { OrgScopedClient } from '@/lib/db/tenant'
import { getReport, type ReportDefinition } from './registry'
import { REPORT_QUERIES } from './queries'
import { branchIdsFor, effectiveBranchIds } from './queries/scope'
import type { Filters, ReportCtx, ReportQuery } from './queries/types'

// Shared plumbing for the generic /r/[reportKey]/* routes: validates the
// key against the registry, enforces per-report roles (on top of the route's
// module gate), extracts only registered filter keys from the query string,
// and builds the ReportCtx with role-based row scoping inputs.

export async function reportRequest(input: {
  reportKey: string | undefined
  url: string
  db: OrgScopedClient
  user: { id: string; orgId: string; role: string }
}): Promise<{
  report: ReportDefinition
  query: ReportQuery
  ctx: ReportCtx
  filters: Filters
}> {
  const key = input.reportKey ?? ''
  const report = getReport(key)
  const query = REPORT_QUERIES[key]
  if (!report || !query || !report.allowedRoles.includes(input.user.role)) {
    throw Errors.notFound('Report')
  }

  const { searchParams } = new URL(input.url)
  const allowed = new Set([
    ...report.filters.map(f => f.key),
    'from', 'to' // date-range filters serialise as from/to
  ])
  const filters: Filters = {}
  searchParams.forEach((value, k) => {
    if (allowed.has(k) && value !== '') filters[k] = value
  })

  // `branch` is a scope selector, not a row filter: fold it into branchIds so
  // every branchScope-using query honours it, then drop it from the filter bag
  // (no query module reads filters.branch).
  const selectedBranch = filters.branch
  delete filters.branch
  const roleBranchIds = await branchIdsFor(input.user.id, input.user.role)

  const ctx: ReportCtx = {
    db: input.db,
    orgId: input.user.orgId,
    userId: input.user.id,
    role: input.user.role,
    branchIds: effectiveBranchIds(roleBranchIds, selectedBranch),
    academicYearId: searchParams.get('academicYearId') ?? undefined
  }

  return { report, query, ctx, filters }
}

export function filtersEcho(filters: Filters): string {
  const parts = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
  return parts.length > 0 ? parts.join(', ') : 'no filters'
}
