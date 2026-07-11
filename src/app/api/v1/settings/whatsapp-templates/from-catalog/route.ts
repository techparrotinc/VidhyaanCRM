import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created, ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'

/**
 * POST — copy a shared-catalog template (Vidhyaan WABA) into the org's
 * template list. Idempotent per [org, sharedTemplate].
 */
export const POST = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, user }) => {
    const body = z.object({ sharedTemplateId: z.string().min(1) }).parse(await req.json())

    const shared = await prisma.sharedWhatsappTemplate.findFirst({
      where: { id: body.sharedTemplateId, isActive: true, deletedAt: null }
    })
    if (!shared) throw Errors.notFound('Catalog template')

    const existing = await prisma.whatsappTemplate.findFirst({
      where: { orgId: user.orgId, sharedTemplateId: shared.id, deletedAt: null }
    })
    if (existing) return ok(existing, 'Template already added')

    const template = await prisma.whatsappTemplate.create({
      data: {
        orgId: user.orgId,
        name: shared.name,
        msg91TemplateId: shared.msg91TemplateId,
        language: shared.language,
        body: shared.body,
        variables: shared.variables ?? undefined,
        category: shared.category,
        metaCategory: shared.metaCategory,
        accountScope: 'VIDHYAAN',
        // Catalog entries mirror templates already approved on Vidhyaan's
        // WABA — immediately usable, no per-org verification needed
        status: 'VERIFIED',
        sharedTemplateId: shared.id,
        createdById: user.id
      }
    })

    return created(template)
  }
})
