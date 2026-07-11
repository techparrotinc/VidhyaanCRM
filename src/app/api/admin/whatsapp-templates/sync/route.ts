import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { getMetaWhatsAppConfig } from '@/lib/platform-config'
import { fetchMetaTemplates } from '@/lib/integrations/meta-whatsapp'
import { guessWaTemplateCategory } from '@/constants/whatsapp-template-categories'

const WRITE_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']

/**
 * POST — imports approved templates from the platform WABA (Meta Cloud API)
 * into the shared catalog. msg91TemplateId keeps holding the Meta template
 * name — it is the same identifier both send routes use. Variables are
 * auto-generated var1..varN from the {{n}} placeholder count; admins refine
 * names afterwards. Existing entries get a body refresh, mapping preserved.
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!WRITE_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const meta = await getMetaWhatsAppConfig()
    if (!meta.accessToken || !meta.wabaId) {
      throw Errors.businessRule(
        'Configure the Meta Cloud API access token and WABA ID in platform settings first.'
      )
    }

    const remote = await fetchMetaTemplates(meta.accessToken, meta.wabaId)

    let imported = 0
    for (const tpl of remote) {
      const existing = await prisma.sharedWhatsappTemplate.findFirst({
        where: { msg91TemplateId: tpl.name, language: tpl.language, deletedAt: null }
      })
      if (existing) {
        await prisma.sharedWhatsappTemplate.update({
          where: { id: existing.id },
          data: { body: tpl.body || existing.body, metaCategory: tpl.category }
        })
        continue
      }

      await prisma.sharedWhatsappTemplate.create({
        data: {
          name: tpl.name.replace(/_/g, ' '),
          msg91TemplateId: tpl.name,
          language: tpl.language,
          body: tpl.body || tpl.name,
          category: guessWaTemplateCategory(tpl.name, tpl.body),
          metaCategory: tpl.category,
          variables:
            tpl.variableCount > 0
              ? Array.from({ length: tpl.variableCount }, (_, i) => `var${i + 1}`)
              : undefined
        }
      })
      imported++
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'SharedWhatsappTemplate',
        entityId: 'meta-sync',
        after: { imported, total: remote.length }
      }
    })

    return ok({ imported, total: remote.length })
  } catch (error) {
    return errorResponse(error)
  }
}
