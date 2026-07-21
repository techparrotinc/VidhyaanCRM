import {
  SESv2Client,
  SendEmailCommand,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
} from '@aws-sdk/client-sesv2'

// Amazon SES — backup transactional email provider (ap-south-1, same AWS
// account as S3). Used by src/lib/integrations/zeptomail as automatic
// failover when ZeptoMail errors, or as primary when EMAIL_PROVIDER=ses.
// Prereq: domain (or from-address) verified in SES + production access.

let cachedClient: SESv2Client | null = null

export function sesConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  )
}

function client(): SESv2Client {
  if (cachedClient) return cachedClient
  cachedClient = new SESv2Client({
    region: process.env.SES_REGION ?? 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  })
  return cachedClient
}

export async function sendViaSes({
  to,
  toName,
  subject,
  htmlBody,
  textBody,
  fromEmail,
  fromName,
}: {
  to: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
  fromEmail: string
  fromName: string
}): Promise<string | undefined> {
  // Quote display names (user-entered — may contain commas etc.).
  const display = (name: string, email: string) =>
    `"${name.replace(/["<>]/g, '')}" <${email}>`
  const res = await client().send(
    new SendEmailCommand({
      FromEmailAddress: display(fromName, fromEmail),
      Destination: {
        ToAddresses: [toName ? display(toName, to) : to],
      },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            ...(textBody ? { Text: { Data: textBody, Charset: 'UTF-8' } } : {}),
          },
        },
      },
    })
  )
  // SES message id — joins delivery/bounce/complaint notifications back to the
  // recipient. SES prefixes the raw id ("<id>@region.amazonses.com") in the
  // Message-ID header, but notifications report this bare id in mail.messageId.
  return res.MessageId
}

// ── BYO custom sending domain (Enterprise) ────────────────────────────────
// Register an org's domain as an SES Easy-DKIM identity and return the 3 DKIM
// CNAME tokens for the user to publish. Idempotent-ish: if the identity already
// exists SES errors, so callers fall back to getDomainIdentity.
export async function createDomainIdentity(
  domain: string
): Promise<{ dkimTokens: string[] }> {
  const res = await client().send(
    new CreateEmailIdentityCommand({
      EmailIdentity: domain,
      DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
    })
  )
  return { dkimTokens: res.DkimAttributes?.Tokens ?? [] }
}

/** Poll SES for a domain identity's verification + DKIM state. */
export async function getDomainIdentity(
  domain: string
): Promise<{ verified: boolean; dkimStatus: string | undefined; dkimTokens: string[] }> {
  const res = await client().send(
    new GetEmailIdentityCommand({ EmailIdentity: domain })
  )
  const dkimStatus = res.DkimAttributes?.Status
  return {
    // DKIM SUCCESS is what actually lets SES sign+send; treat it as verified.
    verified: dkimStatus === 'SUCCESS',
    dkimStatus,
    dkimTokens: res.DkimAttributes?.Tokens ?? [],
  }
}
