import { SendMailClient } from 'zeptomail'
import { getZeptoConfig } from '@/lib/platform-config'
import { isEmailSuppressed } from '@/lib/email/suppression'

const FROM_NAME = 'Vidhyaan'
const CAMPAIGN_NAME = 'Vidhyaan Campaigns'

// Client built lazily from resolved config (admin DB value → env fallback) and
// cached by token so admin credential changes take effect without a restart.
let cachedClient: { token: string; client: SendMailClient } | null = null
function clientForToken(token: string): SendMailClient {
  if (cachedClient && cachedClient.token === token) return cachedClient.client
  const client = new SendMailClient({ url: 'api.zeptomail.in/', token })
  cachedClient = { token, client }
  return client
}

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
}): Promise<{ success: boolean; suppressed?: boolean }> {
  if (await isEmailSuppressed(to)) {
    console.warn(`ZeptoMail: skipping suppressed address (transactional): ${to}`)
    return { success: false, suppressed: true }
  }
  try {
    const cfg = await getZeptoConfig()
    await clientForToken(cfg.token).sendMail({
      from: {
        address: cfg.fromEmail,
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
}): Promise<{ success: boolean; suppressed?: boolean }> {
  if (await isEmailSuppressed(to)) {
    console.warn(`ZeptoMail: skipping suppressed address (campaign): ${to}`)
    return { success: false, suppressed: true }
  }
  try {
    const cfg = await getZeptoConfig()
    await clientForToken(cfg.token).sendMail({
      from: {
        address: cfg.campaignEmail,
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
