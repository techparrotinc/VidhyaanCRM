import { NextRequest, NextResponse } from 'next/server'
import { suppressEmail } from '@/lib/email/suppression'
import { prisma } from '@/lib/db/client'

// SES event webhook (SNS HTTPS subscription). Setup when SES goes live:
//   SES configuration set → event destinations for Delivery, Bounce, Complaint
//   → SNS topic → HTTPS subscription to
//   https://<host>/api/webhooks/ses?key=<SES_WEBHOOK_SECRET>
// (Or per-identity SNS notification topics for Bounce/Complaint/Delivery.)
// First POST is a SubscriptionConfirmation — we auto-confirm by fetching
// SubscribeURL.
//
// Two jobs per event:
//   1. Permanent bounces + complaints → platform suppression list (shared with
//      the ZeptoMail failover so one blocklist governs every send).
//   2. Join back to the CampaignRecipient by SES messageId (stored as
//      providerMessageId at send time) to drive per-campaign delivery/bounce/
//      complaint analytics + the auto-pause guardrail.

/** Map an SES notification to a recipient status update, joined by messageId. */
async function updateRecipientByMessageId(
  messageId: string | undefined,
  data: Record<string, unknown>
): Promise<void> {
  if (!messageId) return
  try {
    await prisma.campaignRecipient.updateMany({
      where: { providerMessageId: messageId },
      data,
    })
  } catch (err) {
    console.error('[SES Webhook] recipient update failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.SES_WEBHOOK_SECRET
  if (secret && req.nextUrl.searchParams.get('key') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    // SNS posts JSON with Content-Type text/plain — parse manually.
    body = JSON.parse(await req.text())
  } catch {
    return NextResponse.json({ success: true, message: 'ignored non-JSON body' })
  }

  try {
    if (body.Type === 'SubscriptionConfirmation' && typeof body.SubscribeURL === 'string') {
      const url = new URL(body.SubscribeURL)
      // Only ever confirm against SNS itself.
      if (url.hostname.endsWith('.amazonaws.com') && url.protocol === 'https:') {
        await fetch(body.SubscribeURL)
        console.log('[SES Webhook] SNS subscription confirmed')
      }
      return NextResponse.json({ success: true })
    }

    if (body.Type === 'Notification' && typeof body.Message === 'string') {
      const event = JSON.parse(body.Message)
      const type: string | undefined = event.eventType ?? event.notificationType
      const messageId: string | undefined = event.mail?.messageId

      if (type === 'Delivery') {
        // Only promote an as-yet-unconfirmed send; never downgrade a later
        // bounce/complaint that may have arrived out of order.
        await prisma.campaignRecipient
          .updateMany({
            where: { providerMessageId: messageId, status: { in: ['SENT'] } },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          })
          .catch((err) => console.error('[SES Webhook] delivery update failed:', err))
      } else if (type === 'Bounce') {
        const isPermanent = event.bounce?.bounceType === 'Permanent'
        const recipients: { emailAddress?: string; diagnosticCode?: string }[] =
          event.bounce?.bouncedRecipients ?? []
        if (isPermanent) {
          for (const r of recipients) {
            if (!r.emailAddress) continue
            await suppressEmail(r.emailAddress, 'hardbounce', 'ses-webhook', r.diagnosticCode)
            console.log(`[SES Webhook] suppressed hard-bounced address: ${r.emailAddress}`)
          }
        }
        // Attribute to the campaign either way (transient bounces still count
        // against deliverability, but we only suppress permanents).
        await updateRecipientByMessageId(messageId, {
          status: 'BOUNCED',
          failureReason: recipients[0]?.diagnosticCode ?? event.bounce?.bounceType ?? 'Bounce',
        })
      } else if (type === 'Complaint') {
        const recipients: { emailAddress?: string }[] =
          event.complaint?.complainedRecipients ?? []
        for (const r of recipients) {
          if (!r.emailAddress) continue
          await suppressEmail(r.emailAddress, 'complaint', 'ses-webhook')
          console.log(`[SES Webhook] suppressed complaint address: ${r.emailAddress}`)
        }
        await updateRecipientByMessageId(messageId, {
          status: 'COMPLAINED',
          failureReason: 'Marked as spam',
        })
      } else if (type === 'Open') {
        // Engagement only — never change delivery status. First open wins.
        if (messageId) {
          await prisma.campaignRecipient
            .updateMany({
              where: { providerMessageId: messageId, openedAt: null },
              data: { openedAt: new Date() },
            })
            .catch((err) => console.error('[SES Webhook] open update failed:', err))
        }
      } else if (type === 'Click') {
        // A click implies an open — set both if not already recorded.
        if (messageId) {
          await prisma.campaignRecipient
            .updateMany({
              where: { providerMessageId: messageId, clickedAt: null },
              data: { clickedAt: new Date() },
            })
            .catch((err) => console.error('[SES Webhook] click update failed:', err))
          await prisma.campaignRecipient
            .updateMany({
              where: { providerMessageId: messageId, openedAt: null },
              data: { openedAt: new Date() },
            })
            .catch(() => {})
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[SES Webhook] processing error:', error)
    return NextResponse.json({ success: true, error: 'processing error' })
  }
}
