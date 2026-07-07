import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { prisma } from '@/lib/db/client'

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  msg91TemplateId: z.string().min(1).max(100),
  language: z.string().min(2).max(10).default('en'),
  body: z.string().min(1).max(1000),
  variables: z.array(z.string().min(1).max(40)).max(10).optional().nullable()
})

export const GET = route({
  module: MODULES.WHATSAPP_ADDON,
  handler: async ({ db, user }) => {
    const templates = await db.whatsappTemplate.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return ok(templates)
  }
})

/**
 * POST — manual template entry. Account scope is derived server-side:
 * templates created by hand belong to the org's OWN WhatsApp account
 * (Vidhyaan-account templates come from the shared catalog via
 * /from-catalog) and start DRAFT until a test send verifies them.
 */
export const POST = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user }) => {
    const data = templateSchema.parse(await req.json())

    const providerConfig = await prisma.messagingProviderConfig.findFirst({
      where: { orgId: user.orgId, channel: 'WHATSAPP', deletedAt: null },
      select: { id: true }
    })

    const template = await db.whatsappTemplate.create({
      data: {
        orgId: user.orgId,
        name: data.name,
        msg91TemplateId: data.msg91TemplateId,
        language: data.language,
        body: data.body,
        variables: data.variables ?? undefined,
        accountScope: 'OWN',
        providerConfigId: providerConfig?.id ?? null,
        status: 'DRAFT',
        createdById: user.id
      }
    })
    return created(template)
  }
})
