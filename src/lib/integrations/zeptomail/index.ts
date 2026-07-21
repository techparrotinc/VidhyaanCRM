import { SendMailClient } from 'zeptomail'
import { getZeptoConfig } from '@/lib/platform-config'
import { isEmailSuppressed } from '@/lib/email/suppression'
import { sendViaSes, sesConfigured } from '@/lib/integrations/ses'

const FROM_NAME = 'Vidhyaan'
const CAMPAIGN_NAME = 'Vidhyaan Campaigns'

// Client built lazily from resolved config (admin DB value → env fallback) and
// cached by token so admin credential changes take effect without a restart.
let cachedClient: { token: string; client: SendMailClient } | null = null
function clientForToken(rawToken: string): SendMailClient {
  if (cachedClient && cachedClient.token === rawToken) return cachedClient.client
  // The SDK sends this string verbatim as the Authorization header — it does
  // NOT add the "Zoho-enczapikey " scheme itself. Tokens pasted from the
  // Zeptomail dashboard sometimes lose that prefix (env files / linters tend
  // to mangle values containing a space), so normalize it here instead of
  // depending on the stored value being exact.
  const token = rawToken.startsWith('Zoho-enczapikey ') ? rawToken : `Zoho-enczapikey ${rawToken}`
  const client = new SendMailClient({ url: 'api.zeptomail.in/', token })
  cachedClient = { token: rawToken, client }
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
  /** Per-send From override (BYO org sending domain). Campaign kind only —
   *  the org's own SES-verified domain instead of shared send.vidhyaan.com. */
  from?: { email: string; name: string }
}

// Single delivery pipeline for both send kinds:
//   suppression check → primary provider → failover to the other provider.
// Primary is ZeptoMail unless EMAIL_PROVIDER=ses (e.g. Zepto account blocked).
// SES (ap-south-1, same AWS creds as S3) participates only when configured —
// domain must be verified in SES or its sends fail and the Zepto error wins.
async function deliver(
  kind: 'transactional' | 'campaign',
  { to, toName, subject, htmlBody, textBody, attachments, from }: SendArgs
): Promise<{ success: boolean; suppressed?: boolean; messageId?: string }> {
  if (await isEmailSuppressed(to)) {
    console.warn(`Email: skipping suppressed address (${kind}): ${to}`)
    return { success: false, suppressed: true }
  }

  const cfg = await getZeptoConfig()
  // BYO org domain wins for campaigns; else the shared campaign/transactional
  // from-addresses from config.
  const fromEmail = from?.email ?? (kind === 'campaign' ? cfg.campaignEmail : cfg.fromEmail)
  const fromName = from?.name ?? (kind === 'campaign' ? CAMPAIGN_NAME : FROM_NAME)

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

  // Provider selection:
  //   CAMPAIGN  → Amazon SES ONLY, from the dedicated send.vidhyaan.com domain
  //               (its reputation is isolated from the transactional domain).
  //               No Zepto fallback: campaigns@send.vidhyaan.com is not verified
  //               in Zepto, so a fallback there would only bounce. In dev with
  //               no SES creds we degrade to Zepto so local sends still work.
  //   TRANSACTIONAL → ZeptoMail primary (SES failover), or SES when
  //               EMAIL_PROVIDER=ses.
  let primary: () => Promise<unknown>
  let fallback: (() => Promise<unknown>) | null
  let primaryName: string
  if (kind === 'campaign') {
    if (sesConfigured()) {
      primary = viaSes
      fallback = null
      primaryName = 'SES'
    } else {
      primary = viaZepto
      fallback = null
      primaryName = 'ZeptoMail (dev fallback — SES not configured)'
    }
  } else {
    const sesPrimary = process.env.EMAIL_PROVIDER === 'ses' && sesConfigured()
    primary = sesPrimary ? viaSes : viaZepto
    fallback = sesPrimary ? viaZepto : (sesConfigured() ? viaSes : null)
    primaryName = sesPrimary ? 'SES' : 'ZeptoMail'
  }

  // SES returns a MessageId string; ZeptoMail returns its own response object.
  // Only the string is our join key for delivery/bounce notifications.
  const asMessageId = (r: unknown) => (typeof r === 'string' ? r : undefined)

  try {
    const r = await primary()
    return { success: true, messageId: asMessageId(r) }
  } catch (error: any) {
    console.error(`${primaryName} ${kind} send error:`, error?.message ?? error)
    if (!fallback) {
      throw new Error(error?.message ?? `Failed to send ${kind} email`)
    }
    try {
      console.warn(`Email: ${primaryName} failed, failing over for ${to}`)
      const r = await fallback()
      return { success: true, messageId: asMessageId(r) }
    } catch (fallbackErr: any) {
      console.error('Email fallback send error:', fallbackErr?.message ?? fallbackErr)
      // Surface the PRIMARY error — it names the provider that should have worked.
      throw new Error(error?.message ?? `Failed to send ${kind} email`)
    }
  }
}

export async function sendTransactionalEmail(
  args: SendArgs
): Promise<{ success: boolean; suppressed?: boolean; messageId?: string }> {
  return deliver('transactional', args)
}

export async function sendCampaignEmail(
  args: SendArgs
): Promise<{ success: boolean; suppressed?: boolean; messageId?: string }> {
  return deliver('campaign', args)
}
