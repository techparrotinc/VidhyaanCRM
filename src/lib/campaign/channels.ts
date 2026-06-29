import { sendCampaignEmail as zeptoSendCampaignEmail } from '@/lib/integrations/zeptomail'

export async function sendCampaignEmail(params: {
  to: string
  subject: string
  body: string
  fromName: string
  campaignName: string
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

  const html = `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    ${bodyContent.replace(/\n/g, '<br/>')}
  </div>`

  await zeptoSendCampaignEmail({
    to: params.to,
    toName: params.to,
    subject,
    htmlBody: html,
    textBody: html.replace(/<[^>]*>/g, '')
  })
}

export async function sendCampaignSMS(params: {
  to: string
  body: string
}): Promise<void> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: process.env.MSG91_AUTH_KEY ?? ''
    },
    body: JSON.stringify({
      flow_id: process.env.MSG91_SMS_FLOW_ID,
      sender: process.env.MSG91_SENDER_ID,
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
  body: string
}): Promise<void> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  const response = await fetch(
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: process.env.MSG91_AUTH_KEY ?? ''
      },
      body: JSON.stringify({
        integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
        content_type: 'template',
        payload: {
          to: formattedPhone,
          type: 'template',
          template: {
            name: params.templateId,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: params.body }]
              }
            ]
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
}
