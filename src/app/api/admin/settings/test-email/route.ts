import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    const adminEmail = session?.user?.email

    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!adminEmail) {
      return NextResponse.json({ error: 'Super Admin email not found in session' }, { status: 400 })
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'default' }
    })

    const fromName = settings?.fromName || 'Vidhyaan'
    const fromEmail = settings?.fromEmailAddress || 'noreply@vidhyaan.com'
    const from = `${fromName} <${fromEmail}>`

    console.log(`[Settings] Sending test email to admin: ${adminEmail} from: ${from}`)

    if (!process.env.ZEPTOMAIL_API_TOKEN) {
      return NextResponse.json(
        { error: 'ZEPTOMAIL_API_TOKEN is not configured in the environment' },
        { status: 500 }
      )
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1a365d; margin-bottom: 16px;">Test Email Successful!</h2>
        <p>Hello,</p>
        <p>This is a test email sent from the Vidhyaan Platform Admin Panel to verify that your ZeptoMail configurations are working correctly.</p>
        <p><strong>Configured Sender Name:</strong> ${fromName}</p>
        <p><strong>Configured Sender Email:</strong> ${fromEmail}</p>
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="color: #718096; font-size: 12px;">This is an automated system notification.</p>
      </div>
    `

    try {
      await sendTransactionalEmail({
        to: adminEmail,
        subject: 'Vidhyaan Platform - Test Email',
        htmlBody,
        textBody: `Test Email Successful! Configured Sender Name: ${fromName}, Configured Sender Email: ${fromEmail}.`
      })
    } catch (sendErr: any) {
      console.error('ZeptoMail API error:', sendErr)
      return NextResponse.json({ error: 'Failed to send email via ZeptoMail API' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Send Test Email API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
