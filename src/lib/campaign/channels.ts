import { sendCampaignEmail as zeptoSendCampaignEmail } from '@/lib/integrations/zeptomail'
import { sendMetaWhatsAppTemplate } from '@/lib/integrations/meta-whatsapp'
import { getMetaWhatsAppConfig } from '@/lib/platform-config'
import { prisma } from '@/lib/db/client'

export async function sendCampaignEmail(params: {
  to: string
  subject: string
  body: string
  fromName: string
  campaignName: string
  /** hero image rendered above the body (e.g. event cover) */
  imageUrl?: string | null
}): Promise<void> {
  let subject = params.subject
  let bodyContent = params.body

  const lines = bodyContent.split('\n')
  const firstLine = lines[0].trim()
  if (firstLine.startsWith('Subject:')) {
    subject = firstLine.replace('Subject:', '').trim()
    bodyContent = lines.slice(1).join('\n').trim()
  }

  if (!subject) {
    subject = params.campaignName || 'Message from your school'
  }

  const heroImg = params.imageUrl
    ? `<img src="${params.imageUrl}" alt="" style="width:100%;max-width:560px;border-radius:12px;display:block;margin-bottom:16px;" />`
    : ''
  const html = `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px;">
    ${heroImg}${bodyContent.replace(/\n/g, '<br/>')}
  </div>`

  await zeptoSendCampaignEmail({
    to: params.to,
    toName: params.to,
    subject,
    htmlBody: html,
    textBody: html.replace(/<[^>]*>/g, '')
  })
}

export interface SmsCredentials {
  authKey: string
  senderId?: string
  flowId?: string
}

export interface WhatsAppCredentials {
  authKey: string
  whatsappNumber?: string
}

export async function sendCampaignSMS(params: {
  to: string
  body: string
  /** Org's own MSG91 account (BYO); falls back to Vidhyaan env keys. */
  credentials?: SmsCredentials
}): Promise<void> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: params.credentials?.authKey ?? process.env.MSG91_AUTH_KEY ?? ''
    },
    body: JSON.stringify({
      flow_id: params.credentials?.flowId ?? process.env.MSG91_SMS_FLOW_ID,
      sender: params.credentials?.senderId ?? process.env.MSG91_SENDER_ID,
      mobiles: formattedPhone,
      body: params.body
    })
  })

  if (!response.ok) {
    let errMsg = 'MSG91 SMS failed'
    try {
      const error = await response.json()
      errMsg = error.message || errMsg
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errMsg)
  }
}

export async function sendCampaignWhatsApp(params: {
  to: string
  templateId: string
  /**
   * Rendered body used as a single {{1}} parameter — legacy mode for
   * templates without a structured variable mapping.
   */
  body: string
  /** Meta language code of the approved template (default en). */
  language?: string
  /**
   * Ordered positional parameters {{1}}..{{n}}. When provided, these are
   * sent instead of the single-body legacy parameter.
   */
  parameters?: string[]
  /** Org's own MSG91 WhatsApp account (BYO); falls back to Vidhyaan env keys. */
  credentials?: WhatsAppCredentials
}): Promise<string | null> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  const parameterTexts = params.parameters ?? [params.body]

  // Platform shared account prefers direct Meta Cloud API when configured in
  // admin settings; BYO org credentials always stay on their own MSG91 route.
  if (!params.credentials) {
    // The shared number carries one sender identity — honour global opt-outs.
    const optedOut = await prisma.whatsappOptOut.findUnique({
      where: { phone: formattedPhone.slice(-10) },
      select: { id: true }
    })
    if (optedOut) {
      throw new Error('Recipient has opted out of WhatsApp messages')
    }

    const meta = await getMetaWhatsAppConfig()
    if (meta.configured) {
      return sendMetaWhatsAppTemplate({
        to: formattedPhone,
        templateName: params.templateId,
        language: params.language,
        parameters: parameterTexts,
        accessToken: meta.accessToken!,
        phoneNumberId: meta.phoneNumberId!
      })
    }
  }

  const components =
    parameterTexts.length > 0
      ? [
          {
            type: 'body',
            parameters: parameterTexts.map(text => ({ type: 'text', text }))
          }
        ]
      : []

  const response = await fetch(
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: params.credentials?.authKey ?? process.env.MSG91_AUTH_KEY ?? ''
      },
      body: JSON.stringify({
        integrated_number: params.credentials?.whatsappNumber ?? process.env.MSG91_WHATSAPP_NUMBER,
        content_type: 'template',
        payload: {
          to: formattedPhone,
          type: 'template',
          template: {
            name: params.templateId,
            language: { code: params.language ?? 'en' },
            components
          }
        }
      })
    }
  )

  if (!response.ok) {
    let errMsg = 'MSG91 WhatsApp send failed'
    try {
      const error = await response.json()
      errMsg = error.message || errMsg
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errMsg)
  }
  return null // MSG91 path exposes no per-message id we track
}
