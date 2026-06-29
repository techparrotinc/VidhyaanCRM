// @ts-ignore
import { SendMailClient } from 'zeptomail'

const client = new SendMailClient({
  url: 'api.zeptomail.in/',
  token: process.env.ZEPTOMAIL_API_TOKEN ?? '',
})

const FROM_EMAIL =
  process.env.ZEPTOMAIL_FROM_EMAIL
  ?? 'noreply@vidhyaan.com'

const FROM_NAME = 'Vidhyaan'

const CAMPAIGN_EMAIL =
  process.env.ZEPTOMAIL_CAMPAIGN_EMAIL
  ?? 'campaigns@vidhyaan.com'

const CAMPAIGN_NAME = 'Vidhyaan Campaigns'

export async function sendTransactionalEmail({
  to,
  toName,
  subject,
  htmlBody,
  textBody,
}: {
  to: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
}): Promise<{ success: boolean }> {
  try {
    await client.sendMail({
      from: {
        address: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: toName ?? to,
          },
        },
      ],
      subject,
      htmlbody: htmlBody,
      textbody: textBody ?? '',
    })
    return { success: true }
  } catch (error: any) {
    console.error(
      'ZeptoMail sendTransactionalEmail error:',
      error?.message ?? error
    )
    throw new Error(
      error?.message ?? 'Failed to send email'
    )
  }
}

export async function sendCampaignEmail({
  to,
  toName,
  subject,
  htmlBody,
  textBody,
}: {
  to: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
}): Promise<{ success: boolean }> {
  try {
    await client.sendMail({
      from: {
        address: CAMPAIGN_EMAIL,
        name: CAMPAIGN_NAME,
      },
      to: [
        {
          email_address: {
            address: to,
            name: toName ?? to,
          },
        },
      ],
      subject,
      htmlbody: htmlBody,
      textbody: textBody ?? '',
    })
    return { success: true }
  } catch (error: any) {
    console.error(
      'ZeptoMail sendCampaignEmail error:',
      error?.message ?? error
    )
    throw new Error(
      error?.message ?? 'Failed to send campaign email'
    )
  }
}
