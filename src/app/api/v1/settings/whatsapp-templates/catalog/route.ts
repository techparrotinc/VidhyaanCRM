import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'

/**
 * GET — active templates from Vidhyaan's shared-WABA catalog, for orgs on
 * the Vidhyaan WhatsApp account to add to their own template list.
 */
export const GET = route({
  module: MODULES.WHATSAPP_ADDON,
  handler: async ({ user }) => {
    const [templates, added] = await Promise.all([
      prisma.sharedWhatsappTemplate.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      }),
      prisma.whatsappTemplate.findMany({
        where: { orgId: user.orgId, deletedAt: null, sharedTemplateId: { not: null } },
        select: { sharedTemplateId: true }
      })
    ])
    const addedIds = new Set(added.map(t => t.sharedTemplateId))

    return ok({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        msg91TemplateId: t.msg91TemplateId,
        language: t.language,
        body: t.body,
        variables: t.variables,
        category: t.category,
        alreadyAdded: addedIds.has(t.id)
      }))
    })
  }
})
