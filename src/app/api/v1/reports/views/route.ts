import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { parseQuery, textParam } from '@/lib/api/query'
import { Errors } from '@/lib/api/errors'
import { getReport, REPORTS_MODULE_SLUG } from '@/lib/reports/registry'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

// Saved views are personal: every query is scoped userId = caller (orgId is
// injected by the tenant client).

function validateFilters(reportKey: string, role: string, filters: unknown) {
  const report = getReport(reportKey)
  if (!report || !report.allowedRoles.includes(role)) {
    throw Errors.validation({ reportKey: ['Unknown report'] })
  }
  if (typeof filters !== 'object' || filters === null || Array.isArray(filters)) {
    throw Errors.validation({ filters: ['Must be an object'] })
  }
  const allowed = new Set(report.filters.map(f => f.key))
  const unknown = Object.keys(filters).filter(k => !allowed.has(k))
  if (unknown.length > 0) {
    throw Errors.validation({ filters: [`Unknown filter keys: ${unknown.join(', ')}`] })
  }
}

export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db }) => {
    const { reportKey } = parseQuery(req.url, { reportKey: textParam })
    const views = await db.reportSavedView.findMany({
      where: { userId: user.id, ...(reportKey ? { reportKey } : {}) },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
    })
    return ok(views)
  }
})

const createSchema = z.object({
  reportKey: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  filters: z.unknown(),
  isDefault: z.boolean().optional()
})

export const POST = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db }) => {
    const body = createSchema.parse(await req.json())
    validateFilters(body.reportKey, user.role, body.filters)

    const duplicate = await db.reportSavedView.findFirst({
      where: { userId: user.id, reportKey: body.reportKey, name: body.name }
    })
    if (duplicate) {
      throw Errors.validation({ name: ['A view with this name already exists'] })
    }

    if (body.isDefault) {
      await db.reportSavedView.updateMany({
        where: { userId: user.id, reportKey: body.reportKey, isDefault: true },
        data: { isDefault: false }
      })
    }

    const view = await db.reportSavedView.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        reportKey: body.reportKey,
        name: body.name,
        filters: body.filters as object,
        isDefault: body.isDefault ?? false
      }
    })
    return created(view)
  }
})
