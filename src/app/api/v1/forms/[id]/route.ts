import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { updateFormSchema, assertUniqueFieldKeys, schemaHasContactPhone } from '@/lib/forms/validation'
import type { FormSchema } from '@/lib/forms/types'

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user, params }) => {
    const form = await db.form.findFirst({
      where: { id: params!.id, orgId: user.orgId },
    })
    if (!form) throw Errors.notFound('Form')
    return ok(form)
  },
})

export const PATCH = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const body = updateFormSchema.parse(await req.json())
    if (body.schema) assertUniqueFieldKeys(body.schema)

    const existing = await db.form.findFirst({
      where: { id: params!.id, orgId: user.orgId },
      select: { id: true, purpose: true, version: true, feeRequired: true, applicationFeeAmount: true, schema: true },
    })
    if (!existing) throw Errors.notFound('Form')

    // Publish guards: a positive fee (else parent hits a ₹0 gateway dead-end)
    // and a phone-mapped field (identity/dedup key).
    if (body.status === 'PUBLISHED') {
      const feeReq = body.feeRequired ?? existing.feeRequired
      const amt = body.applicationFeeAmount ?? (existing.applicationFeeAmount != null ? Number(existing.applicationFeeAmount) : null)
      if (feeReq && (amt == null || amt <= 0)) {
        throw Errors.validation({ applicationFeeAmount: ['Set an application fee greater than 0 before publishing'] })
      }
      const effectiveSchema = (body.schema ?? existing.schema) as FormSchema
      if (!schemaHasContactPhone(effectiveSchema)) {
        throw Errors.validation({ schema: ['Add a field mapped to Phone before publishing so submissions can be identified'] })
      }
    }

    // One default per purpose — unset siblings first.
    if (body.isDefault) {
      await db.form.updateMany({
        where: { orgId: user.orgId, purpose: existing.purpose, id: { not: existing.id } },
        data: { isDefault: false },
      })
    }

    const form = await db.form.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        description: body.description,
        // Editing the schema bumps version so historical submissions keep
        // their snapshot (schemaVersion).
        ...(body.schema ? { schema: body.schema, version: existing.version + 1 } : {}),
        settings: body.settings ?? undefined,
        courseIds: body.courseIds,
        gradeLabels: body.gradeLabels,
        applicationFeeAmount: body.applicationFeeAmount ?? undefined,
        feeCurrency: body.feeCurrency,
        feeRequired: body.feeRequired,
        status: body.status,
        isDefault: body.isDefault,
      },
    })
    return ok(form)
  },
})

export const DELETE = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user, params }) => {
    const existing = await db.form.findFirst({
      where: { id: params!.id, orgId: user.orgId },
      select: { id: true },
    })
    if (!existing) throw Errors.notFound('Form')
    // Soft delete (Form is in SOFT_DELETE_MODELS).
    await db.form.delete({ where: { id: existing.id } })
    return ok({ id: existing.id })
  },
})
