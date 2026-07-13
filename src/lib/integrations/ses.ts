import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

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
}): Promise<void> {
  // Quote display names (user-entered — may contain commas etc.).
  const display = (name: string, email: string) =>
    `"${name.replace(/["<>]/g, '')}" <${email}>`
  await client().send(
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
}
