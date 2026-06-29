import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { AuditAction } from '@prisma/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orgId, title, message, type, channel } = body

    if (!orgId || !title || !message || !type || !channel) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Fetch recipient orgs
    let targetOrgs: { id: string; email: string }[] = []
    if (orgId === 'all') {
      targetOrgs = await prisma.organization.findMany({
        where: { deletedAt: null },
        select: { id: true, email: true }
      })
    } else {
      const org = await prisma.organization.findFirst({
        where: { id: orgId, deletedAt: null },
        select: { id: true, email: true }
      })
      if (org) targetOrgs.push(org)
    }

    if (targetOrgs.length === 0) {
      return NextResponse.json({ error: 'No target organizations found' }, { status: 404 })
    }

    // 2. Process In-App Notifications
    if (channel === 'IN_APP' || channel === 'BOTH') {
      // Batch create in chunks of 100
      for (let i = 0; i < targetOrgs.length; i += 100) {
        const chunk = targetOrgs.slice(i, i + 100)
        await prisma.notification.createMany({
          data: chunk.map((org) => ({
            orgId: org.id,
            recipientType: 'USER',
            recipientId: null,
            channel: 'IN_APP',
            title,
            body: message,
            data: { type }
          }))
        })
      }
    }

    // 3. Process Email Notifications via Resend
    let emailsSent = 0
    if (channel === 'EMAIL' || channel === 'BOTH') {
      const settings = await prisma.platformSettings.findUnique({
        where: { id: 'default' }
      })

      const fromName = settings?.fromName || 'Vidhyaan'
      const fromEmail = settings?.fromEmailAddress || 'noreply@vidhyaan.com'
      const from = `${fromName} <${fromEmail}>`

      const sendEmail = async (to: string) => {
        if (!process.env.ZEPTOMAIL_API_TOKEN) {
          console.warn('Skipping email send: ZEPTOMAIL_API_TOKEN is not configured')
          return false
        }
        try {
          await sendTransactionalEmail({
            to,
            subject: title,
            htmlBody: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1a365d; margin-bottom: 16px;">${title}</h2>
                <p style="font-size: 15px; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
                <p style="font-size: 12px; color: #718096;">This is an administrative alert from Vidhyaan Platform Operations.</p>
              </div>
            `,
            textBody: message
          })
          return true
        } catch (emailErr) {
          console.error(`Failed to send ZeptoMail email to ${to}:`, emailErr)
          return false
        }
      }

      // Concurrently dispatch emails with proper error handling
      const emailPromises = targetOrgs.map(async (org) => {
        if (org.email && org.email.includes('@')) {
          const ok = await sendEmail(org.email)
          if (ok) emailsSent++
        }
      })
      await Promise.all(emailPromises)
    }

    return NextResponse.json({
      success: true,
      sent: targetOrgs.length,
      emailsSent
    })

  } catch (error: any) {
    console.error('Notify Admin API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
