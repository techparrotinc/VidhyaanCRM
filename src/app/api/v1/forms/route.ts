import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { availablePurposes } from '@/lib/forms/targets'
import { enabledModuleSlugs } from '@/lib/forms/modules'
import { createFormSchema, assertUniqueFieldKeys, schemaHasContactPhone } from '@/lib/forms/validation'

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user }) => {
    const forms = await db.form.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, purpose: true, status: true,
        version: true, isDefault: true, feeRequired: true, applicationFeeAmount: true,
        courseIds: true, gradeLabels: true, updatedAt: true,
        // Share-link visits mint LINK-channel instances (apply/f route); only
        // deliberate sends (email/WhatsApp/campaign) count as "sent".
        _count: { select: { instances: { where: { channel: { not: 'LINK' } } }, submissions: true } },
      },
    })
    return ok(forms)
  },
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = createFormSchema.parse(await req.json())
    assertUniqueFieldKeys(body.schema)

    // Guard: purpose must be licensed for this org.
    const [modules, org] = await Promise.all([
      enabledModuleSlugs(user.orgId),
      prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { institutionType: true },
      }),
    ])
    const allowed = availablePurposes({ enabledModules: modules, institutionType: org?.institutionType })
    const { Errors } = await import('@/lib/api/errors')
    if (!allowed.includes(body.purpose)) {
      throw Errors.forbidden(`Form purpose ${body.purpose} is not available on your plan`)
    }

    // Publishing straight away must satisfy the publish guards.
    if (body.status === 'PUBLISHED') {
      if (body.feeRequired && !(body.applicationFeeAmount && body.applicationFeeAmount > 0)) {
        throw Errors.validation({ applicationFeeAmount: ['Set an application fee greater than 0 before publishing'] })
      }
      if (!schemaHasContactPhone(body.schema)) {
        throw Errors.validation({ schema: ['Add a field mapped to Phone before publishing so submissions can be identified'] })
      }
    }

    const form = await db.form.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        description: body.description ?? null,
        purpose: body.purpose,
        status: body.status ?? 'DRAFT',
        schema: body.schema,
        settings: body.settings ?? undefined,
        courseIds: body.courseIds ?? [],
        gradeLabels: body.gradeLabels ?? [],
        applicationFeeAmount: body.applicationFeeAmount ?? null,
        feeCurrency: body.feeCurrency ?? 'INR',
        feeRequired: body.feeRequired ?? false,
        createdById: user.id,
      },
    })
    return created(form)
  },
})
