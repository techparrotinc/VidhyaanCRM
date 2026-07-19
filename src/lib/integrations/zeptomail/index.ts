import { SendMailClient } from 'zeptomail'
import { getZeptoConfig } from '@/lib/platform-config'
import { isEmailSuppressed } from '@/lib/email/suppression'
import { sendViaSes, sesConfigured } from '@/lib/integrations/ses'

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

export interface EmailAttachment {
  /** File name shown in the mail client. */
  name: string
  /** Base64-encoded content. */
  content: string
  mime_type: string
}

interface SendArgs {
  to: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
  /** Delivered via ZeptoMail; the SES failover sends without attachments. */
  attachments?: EmailAttachment[]
}

// Single delivery pipeline for both send kinds:
//   suppression check → primary provider → failover to the other provider.
// Primary is ZeptoMail unless EMAIL_PROVIDER=ses (e.g. Zepto account blocked).
// SES (ap-south-1, same AWS creds as S3) participates only when configured —
// domain must be verified in SES or its sends fail and the Zepto error wins.
async function deliver(
  kind: 'transactional' | 'campaign',
  { to, toName, subject, htmlBody, textBody, attachments }: SendArgs
): Promise<{ success: boolean; suppressed?: boolean }> {
  if (await isEmailSuppressed(to)) {
    console.warn(`Email: skipping suppressed address (${kind}): ${to}`)
    return { success: false, suppressed: true }
  }

  const cfg = await getZeptoConfig()
  const fromEmail = kind === 'campaign' ? cfg.campaignEmail : cfg.fromEmail
  const fromName = kind === 'campaign' ? CAMPAIGN_NAME : FROM_NAME

  const viaZepto = () =>
    clientForToken(cfg.token).sendMail({
      from: { address: fromEmail, name: fromName },
      to: [{ email_address: { address: to, name: toName ?? to } }],
      subject,
      htmlbody: htmlBody,
      textbody: textBody ?? '',
      ...(attachments?.length ? { attachments } : {})
    })
  const viaSes = () =>
    sendViaSes({ to, toName, subject, htmlBody, textBody, fromEmail, fromName })

  const sesPrimary = process.env.EMAIL_PROVIDER === 'ses' && sesConfigured()
  const [primary, fallback] = sesPrimary
    ? [viaSes, viaZepto]
    : [viaZepto, sesConfigured() ? viaSes : null]
  const primaryName = sesPrimary ? 'SES' : 'ZeptoMail'

  try {
    await primary()
    return { success: true }
  } catch (error: any) {
    console.error(`${primaryName} ${kind} send error:`, error?.message ?? error)
    if (!fallback) {
      throw new Error(error?.message ?? `Failed to send ${kind} email`)
    }
    try {
      console.warn(`Email: failing over to ${sesPrimary ? 'ZeptoMail' : 'SES'} for ${to}`)
      await fallback()
      return { success: true }
    } catch (fallbackErr: any) {
      console.error('Email fallback send error:', fallbackErr?.message ?? fallbackErr)
      // Surface the PRIMARY error — it names the provider that should have worked.
      throw new Error(error?.message ?? `Failed to send ${kind} email`)
    }
  }
}

export async function sendTransactionalEmail(
  args: SendArgs
): Promise<{ success: boolean; suppressed?: boolean }> {
  return deliver('transactional', args)
}

export async function sendCampaignEmail(
  args: SendArgs
): Promise<{ success: boolean; suppressed?: boolean }> {
  return deliver('campaign', args)
}
