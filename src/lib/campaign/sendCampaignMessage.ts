import { CampaignChannel } from '@prisma/client'
import { format } from 'date-fns'
import { sendCampaignEmail, sendCampaignSMS, sendCampaignWhatsApp } from './channels'
import { prisma } from '@/lib/db/client'

function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template
    .replace(/\{\{parentName\}\}/g, variables.parentName ?? '')
    .replace(/\{\{kidName\}\}/g, variables.kidName ?? '')
    .replace(/\{\{schoolName\}\}/g, variables.schoolName ?? '')
    .replace(/\{\{date\}\}/g, variables.date ?? '')
    .replace(/\{\{amount\}\}/g, variables.amount ?? '')
}

export async function sendCampaignMessage(
  campaign: {
    id: string
    name: string
    channel: CampaignChannel
    templateBody: string | null
    organization: {
      name: string
    }
  },
  recipient: {
    name: string
    phone: string | null
    email: string | null
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
    const variables = {
      parentName: recipient.name,
      kidName: '',
      schoolName: campaign.organization.name,
      date: format(new Date(), 'd MMM yyyy'),
      amount: ''
    }

    let bodyText = template
    let templateId = ''

    if (campaign.channel === CampaignChannel.WHATSAPP) {
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
