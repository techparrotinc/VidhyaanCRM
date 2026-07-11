// WhatsApp enquiry acknowledgement to the parent when a lead is created.
// Fire-and-forget from the lead-create path — a send failure must never
// block or fail lead creation.

import { prisma } from '@/lib/db/client'
import { sendMeteredWhatsApp } from '@/lib/credits/metered-send'
import { buildTemplateParameters } from '@/lib/campaign/templateParams'
import { enabledModuleSlugs } from '@/lib/forms/modules'
import { MODULES } from '@/constants/modules'
import { cleanPhoneNumber } from '@/lib/utils'

/** Well-known template the ack rides on; orgs get it from the shared catalog. */
const ACK_TEMPLATE_NAME = 'enquiry_received'

export async function sendLeadWhatsAppAck(
  orgId: string,
  lead: {
    id: string
    parentName: string
    phone: string
    kidName?: string | null
    gradeSought?: string | null
    course?: string | null
  }
): Promise<void> {
  const modules = await enabledModuleSlugs(orgId)
  if (!modules.has(MODULES.WHATSAPP_ADDON)) return

  // The org must have adopted the enquiry_received template (catalog copy or
  // own-WABA equivalent); silently skip otherwise.
  const template = await prisma.whatsappTemplate.findFirst({
    where: {
      orgId,
      msg91TemplateId: ACK_TEMPLATE_NAME,
      status: { in: ['VERIFIED', 'SYNCED'] },
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' }
  })
  if (!template) return

  const phone = cleanPhoneNumber(lead.phone) as string
  if (!phone) return

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true }
  })

  // Friendly fallbacks — leads are often created with just a name + phone,
  // and Meta rejects empty template parameters.
  const parameters = buildTemplateParameters(template.variables, {
    parentName: lead.parentName,
    kidName: lead.kidName || 'your child',
    schoolName: org?.name || 'our school',
    grade: lead.gradeSought || lead.course || 'admission'
  })

  await sendMeteredWhatsApp(
    orgId,
    phone,
    template.msg91TemplateId,
    `Hi ${lead.parentName}, thank you for your enquiry at ${org?.name ?? 'our school'}. Our admission team will contact you shortly.`,
    `lead_ack:${lead.id}`,
    { language: template.language, parameters: parameters ?? undefined }
  )
}
