import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { sendCampaignWhatsApp } from '@/lib/campaign/channels'
import { getActiveProviderConfig } from '@/lib/credits/provider'
import { buildTemplateParameters } from '@/lib/campaign/templateParams'

/**
 * POST — verifies an OWN-account template by sending a real test message
 * through the org's verified WhatsApp provider. Success → VERIFIED, which
 * makes the template usable in campaigns.
 */
export const POST = route({
  module: MODULES.WHATSAPP_ADDON,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) throw Errors.notFound('Template')

    const body = z.object({
      testPhone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile required')
    }).parse(await req.json())

    const template = await db.whatsappTemplate.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!template) throw Errors.notFound('Template')
    if (template.accountScope !== 'OWN') {
      throw Errors.businessRule('Vidhyaan catalog templates are pre-verified — no test needed.')
    }

    const creds = await getActiveProviderConfig(user.orgId, 'WHATSAPP')
    if (!creds) {
      throw Errors.businessRule(
        'Connect and verify your own WhatsApp account first (Settings → Add-ons → WhatsApp).'
      )
    }

    const sampleValues = {
      parentName: 'Test Parent',
      kidName: 'Test Student',
      schoolName: 'Your School',
      date: new Date().toLocaleDateString('en-IN'),
      amount: '1000'
    }
    const parameters = buildTemplateParameters(template.variables, sampleValues)

    try {
      await sendCampaignWhatsApp({
        to: body.testPhone,
        templateId: template.msg91TemplateId,
        body: template.body,
        language: template.language,
        parameters: parameters ?? undefined,
        credentials: {
          authKey: creds.authKey,
          whatsappNumber: creds.whatsappNumber
        }
      })
    } catch (err: any) {
      return ok({
        verified: false,
        error: err.message || 'Test send failed — check the template name, language and variable count.'
      })
    }

    const updated = await prisma.whatsappTemplate.update({
      where: { id: template.id },
      data: { status: 'VERIFIED' }
    })

    return ok({ verified: true, status: updated.status })
  }
})
