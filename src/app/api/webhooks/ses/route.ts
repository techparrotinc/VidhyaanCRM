import { NextRequest, NextResponse } from 'next/server'
import { suppressEmail } from '@/lib/email/suppression'

// SES bounce webhook (SNS HTTPS subscription). Setup when SES goes live:
//   SES configuration set → event destination (Bounce) → SNS topic →
//   HTTPS subscription to https://<host>/api/webhooks/ses?key=<SES_WEBHOOK_SECRET>
// First POST is a SubscriptionConfirmation — we auto-confirm by fetching
// SubscribeURL. Permanent bounces land in the same suppression list Zepto
// feeds, so failover sends respect one shared blocklist.

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
      const isBounce = event.eventType === 'Bounce' || event.notificationType === 'Bounce'
      if (isBounce && event.bounce?.bounceType === 'Permanent') {
        const recipients: { emailAddress?: string; diagnosticCode?: string }[] =
          event.bounce.bouncedRecipients ?? []
        for (const r of recipients) {
          if (!r.emailAddress) continue
          await suppressEmail(r.emailAddress, 'hardbounce', 'ses-webhook', r.diagnosticCode)
          console.log(`[SES Webhook] suppressed hard-bounced address: ${r.emailAddress}`)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[SES Webhook] processing error:', error)
    return NextResponse.json({ success: true, error: 'processing error' })
  }
}
