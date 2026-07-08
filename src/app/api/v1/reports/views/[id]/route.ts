import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { getReport, REPORTS_MODULE_SLUG } from '@/lib/reports/registry'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  filters: z.unknown().optional(),
  isDefault: z.boolean().optional()
})

export const PATCH = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db, params }) => {
    const id = params?.id
    const body = patchSchema.parse(await req.json())

    const view = await db.reportSavedView.findFirst({
      where: { id, userId: user.id }
    })
    if (!view) throw Errors.notFound('Saved view')

    if (body.filters !== undefined) {
      const report = getReport(view.reportKey)
      const allowed = new Set(report?.filters.map(f => f.key) ?? [])
      if (typeof body.filters !== 'object' || body.filters === null || Array.isArray(body.filters)) {
        throw Errors.validation({ filters: ['Must be an object'] })
      }
      const unknown = Object.keys(body.filters).filter(k => !allowed.has(k))
      if (unknown.length > 0) {
        throw Errors.validation({ filters: [`Unknown filter keys: ${unknown.join(', ')}`] })
      }
    }

    if (body.isDefault) {
      await db.reportSavedView.updateMany({
        where: { userId: user.id, reportKey: view.reportKey, isDefault: true },
        data: { isDefault: false }
      })
    }

    const updated = await db.reportSavedView.update({
      where: { id: view.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.filters !== undefined ? { filters: body.filters as object } : {}),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {})
      }
    })
    return ok(updated)
  }
})

export const DELETE = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ user, db, params }) => {
    const id = params?.id
    const view = await db.reportSavedView.findFirst({
      where: { id, userId: user.id }
    })
    if (!view) throw Errors.notFound('Saved view')

    await db.reportSavedView.delete({ where: { id: view.id } })
    return ok({ deleted: true })
  }
})
