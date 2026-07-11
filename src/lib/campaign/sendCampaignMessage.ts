import { CampaignChannel } from '@prisma/client'
import { format } from 'date-fns'
import { sendCampaignEmail, sendCampaignSMS, sendCampaignWhatsApp } from './channels'
import { prisma } from '@/lib/db/client'
import { buildTemplateParameters } from './templateParams'

function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template
    .replace(/\{\{parentName\}\}/g, variables.parentName ?? '')
    .replace(/\{\{kidName\}\}/g, variables.kidName ?? '')
    .replace(/\{\{schoolName\}\}/g, variables.schoolName ?? '')
    .replace(/\{\{grade\}\}/g, variables.grade ?? '')
    .replace(/\{\{date\}\}/g, variables.date ?? '')
    .replace(/\{\{amount\}\}/g, variables.amount ?? '')
    .replace(/\{\{link\}\}/g, variables.link ?? '')
}

export async function sendCampaignMessage(
  campaign: {
    id: string
    name: string
    channel: CampaignChannel
    templateBody: string | null
    whatsappTemplateId?: string | null
    /** Compose-time custom token values (merged over auto-filled ones). */
    paramValues?: Record<string, string> | null
    organization: {
      name: string
    }
  },
  recipient: {
    name: string
    phone: string | null
    email: string | null
    /** per-recipient digital-form link, substituted for {{link}} (EMAIL/SMS) */
    formLink?: string | null
  },
  /** Org's own MSG91 credentials (BYO); undefined = Vidhyaan account. */
  providerCreds?: {
    authKey: string
    senderId?: string
    smsFlowId?: string
    whatsappNumber?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = campaign.templateBody || ''
    // Auto-filled per-recipient values; compose-time custom values win for
    // any token the campaign author typed explicitly (blank customs ignored).
    const customValues = Object.fromEntries(
      Object.entries(campaign.paramValues ?? {}).filter(([, v]) => v?.trim())
    )
    const variables = {
      parentName: recipient.name,
      kidName: '',
      schoolName: campaign.organization.name,
      grade: '',
      date: format(new Date(), 'd MMM yyyy'),
      amount: '',
      ...customValues,
      link: recipient.formLink ?? ''
    }

    let bodyText = template
    let templateId = ''
    let templateLanguage: string | undefined
    let templateParameters: string[] | undefined

    if (campaign.channel === CampaignChannel.WHATSAPP) {
      // Primary path: campaign carries a template FK — use the approved
      // template's name/language and build positional {{1}}..{{n}} params
      // from its ordered variable mapping.
      if (campaign.whatsappTemplateId) {
        const dbCampaign = await prisma.campaign.findUnique({
          where: { id: campaign.id },
          select: { orgId: true }
        })
        const chosen = dbCampaign
          ? await prisma.whatsappTemplate.findFirst({
              where: {
                id: campaign.whatsappTemplateId,
                orgId: dbCampaign.orgId,
                deletedAt: null
              }
            })
          : null
        if (chosen) {
          templateId = chosen.msg91TemplateId
          templateLanguage = chosen.language
          const params = buildTemplateParameters(chosen.variables, variables)
          if (params) {
            templateParameters = params
          } else {
            // Template without a variable mapping — legacy single-blob
            bodyText = chosen.body
          }
        }
      }

      // Legacy fallback for campaigns created before the template FK
      if (!templateId) {
        console.warn(
          `[campaign ${campaign.id}] WhatsApp send without template FK — using legacy resolution`
        )
        const lines = template.split('\n')
        const firstLine = lines[0].trim()
        if (firstLine.startsWith('TemplateId:')) {
          templateId = firstLine.replace('TemplateId:', '').trim()
          bodyText = lines.slice(1).join('\n').trim()
        } else if (firstLine.startsWith('Template:')) {
          templateId = firstLine.replace('Template:', '').trim()
          bodyText = lines.slice(1).join('\n').trim()
        } else {
          // Find DLT template name from org's templates
          const dbCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id },
            select: { orgId: true }
          })
          if (dbCampaign) {
            const match = await prisma.whatsappTemplate.findFirst({
              where: {
                orgId: dbCampaign.orgId,
                deletedAt: null
              }
            })
            if (match) {
              templateId = match.msg91TemplateId
            }
          }
          if (!templateId) {
            templateId = campaign.name.toLowerCase().replace(/\s+/g, '_')
          }
        }
      }
    }

    const body = replaceVariables(bodyText, variables)

    if (campaign.channel === CampaignChannel.EMAIL) {
      if (!recipient.email) {
        return { success: false, error: 'No email address' }
      }
      await sendCampaignEmail({
        to: recipient.email,
        subject: '', // subject will be parsed in sendCampaignEmail from body
        body,
        fromName: campaign.organization.name,
        campaignName: campaign.name
      })
    } else if (campaign.channel === CampaignChannel.SMS) {
      if (!recipient.phone) {
        return { success: false, error: 'No phone number' }
      }
      await sendCampaignSMS({
        to: recipient.phone,
        body,
        credentials: providerCreds
          ? {
              authKey: providerCreds.authKey,
              senderId: providerCreds.senderId,
              flowId: providerCreds.smsFlowId
            }
          : undefined
      })
    } else if (campaign.channel === CampaignChannel.WHATSAPP) {
      if (!recipient.phone) {
        return { success: false, error: 'No phone number' }
      }
      await sendCampaignWhatsApp({
        to: recipient.phone,
        templateId,
        body,
        language: templateLanguage,
        parameters: templateParameters,
        credentials: providerCreds
          ? {
              authKey: providerCreds.authKey,
              whatsappNumber: providerCreds.whatsappNumber
            }
          : undefined
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Sending failed' }
  }
}
