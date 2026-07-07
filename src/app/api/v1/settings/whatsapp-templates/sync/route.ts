import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { getActiveProviderConfig } from '@/lib/credits/provider'
import { fetchMsg91Templates, Msg91TemplateSyncError } from '@/lib/integrations/msg91/templates'

/**
 * POST — imports approved templates from the org's own MSG91 WhatsApp
 * account. Variables are auto-generated as var1..varN from the {{n}}
 * placeholder count; the school refines the mapping afterwards. Manual
 * entry remains the fallback when MSG91's list API misbehaves.
 */
export const POST = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    const creds = await getActiveProviderConfig(user.orgId, 'WHATSAPP')
    if (!creds || !creds.whatsappNumber) {
      throw Errors.businessRule(
        'Connect and verify your own WhatsApp account (with its integrated number) first.'
      )
    }

    let remote
    try {
      remote = await fetchMsg91Templates(creds.authKey, creds.whatsappNumber)
    } catch (err) {
      if (err instanceof Msg91TemplateSyncError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not read templates from MSG91 right now — add them manually below.'
          },
          { status: 502 }
        )
      }
      throw err
    }

    const providerConfig = await prisma.messagingProviderConfig.findFirst({
      where: { orgId: user.orgId, channel: 'WHATSAPP', deletedAt: null },
      select: { id: true }
    })

    let imported = 0
    for (const tpl of remote) {
      const existing = await prisma.whatsappTemplate.findFirst({
        where: {
          orgId: user.orgId,
          msg91TemplateId: tpl.name,
          language: tpl.language,
          accountScope: 'OWN',
          deletedAt: null
        }
      })
      if (existing) {
        // Keep body fresh; preserve the school's variable mapping
        await prisma.whatsappTemplate.update({
          where: { id: existing.id },
          data: { body: tpl.body || existing.body, status: 'SYNCED' }
        })
        continue
      }

      await prisma.whatsappTemplate.create({
        data: {
          orgId: user.orgId,
          name: tpl.name.replace(/_/g, ' '),
          msg91TemplateId: tpl.name,
          language: tpl.language,
          body: tpl.body || tpl.name,
          variables:
            tpl.variableCount > 0
              ? Array.from({ length: tpl.variableCount }, (_, i) => `var${i + 1}`)
              : undefined,
          accountScope: 'OWN',
          providerConfigId: providerConfig?.id ?? null,
          status: 'SYNCED',
          createdById: user.id
        }
      })
      imported++
    }

    return ok({ imported, total: remote.length })
  }
})
