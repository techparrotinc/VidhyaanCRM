import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const headers = {
      'svix-id': req.headers.get('svix-id') || req.headers.get('webhook-id') || '',
      'svix-timestamp': req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp') || '',
      'svix-signature': req.headers.get('svix-signature') || req.headers.get('webhook-signature') || '',
    }

    const secret = process.env.RESEND_WEBHOOK_SECRET
    if (!secret) {
      console.warn('[Resend Webhook] Secret key is not configured, skipping signature validation.')
    } else {
      const wh = new Webhook(secret)
      try {
        wh.verify(payload, headers)
      } catch (err) {
        console.error('[Resend Webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(payload)
    const eventType = event.type
    const emailId = event.data?.email_id
    const toEmail = event.data?.to?.[0]
    const fromEmail = event.data?.from
    const subject = event.data?.subject

    console.log(`[Resend Webhook] Event received: ${eventType} for ${toEmail}`)

    // 1. Resolve organization and user from the recipient's email address
    let orgId = null
    let userId = null

    if (toEmail) {
      const user = await prisma.user.findFirst({
        where: { email: toEmail, deletedAt: null }
      })
      if (user) {
        userId = user.id
        orgId = user.orgId
      } else {
        const org = await prisma.organization.findFirst({
          where: { email: toEmail }
        })
        if (org) {
          orgId = org.id
        }
      }
    }

    // 2. Update existing communication logs if available
    if (emailId) {
      await prisma.communicationLog.updateMany({
        where: { providerRef: emailId },
        data: { status: eventType.replace('email.', '').toUpperCase() }
      }).catch(err => console.error('[Resend Webhook] Failed to update communication log:', err))
    }

    // 3. Log event details to AuditLog
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'UPDATE',
        entityType: 'EMAIL_DELIVERY',
        entityId: emailId || toEmail || 'unknown',
        before: { status: 'PENDING' },
        after: {
          to: toEmail,
          from: fromEmail,
          subject,
          status: eventType,
          invalid: eventType === 'email.bounced',
          spamRisk: eventType === 'email.complained'
        }
      }
    }).catch(err => console.error('[Resend Webhook] Failed to write audit log:', err))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[Resend Webhook] Processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
