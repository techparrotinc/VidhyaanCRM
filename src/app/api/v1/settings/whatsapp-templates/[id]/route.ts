import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  msg91TemplateId: z.string().min(1).max(100),
  language: z.string().min(2).max(10),
  body: z.string().min(1).max(1000),
  variables: z.array(z.string().min(1).max(40)).max(10).optional().nullable()
})

export const GET = route({
  module: MODULES.WHATSAPP_ADDON,
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Template')
    }

    const template = await db.whatsappTemplate.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!template) {
      throw Errors.notFound('Template')
    }

    return ok(template)
  }
})

export const PUT = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Template')
    }

    const data = templateSchema.partial().parse(await req.json())

    const existing = await db.whatsappTemplate.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!existing) {
      throw Errors.notFound('Template')
    }

    // Catalog copies mirror Vidhyaan's approved templates — edits would
    // desync them from the real WABA template. Remove + re-add instead.
    if (existing.accountScope === 'VIDHYAAN') {
      throw Errors.businessRule(
        'Vidhyaan catalog templates cannot be edited. Remove it and add the updated one from the catalog.'
      )
    }

    // Content changes invalidate the previous verification
    const contentChanged =
      data.msg91TemplateId !== undefined ||
      data.body !== undefined ||
      data.language !== undefined ||
      data.variables !== undefined

    const updated = await db.whatsappTemplate.update({
      where: { id },
      data: {
        ...data,
        variables: data.variables === undefined ? undefined : data.variables ?? undefined,
        ...(contentChanged ? { status: 'DRAFT' } : {})
      }
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Template')
    }

    const existing = await db.whatsappTemplate.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!existing) {
      throw Errors.notFound('Template')
    }

    await db.whatsappTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    return ok({ success: true })
  }
})
