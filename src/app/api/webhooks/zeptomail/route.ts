import { NextRequest, NextResponse } from 'next/server'
import { suppressEmail } from '@/lib/email/suppression'

// ZeptoMail bounce webhook. Configure in ZeptoMail → Mail Agent → Webhooks
// with the "Hard bounces" event pointing at
//   https://<host>/api/webhooks/zeptomail
// Auth: Zepto's "Authorization headers" field — key `x-webhook-key`, value =
// ZEPTOMAIL_WEBHOOK_SECRET (query `?key=` also accepted as fallback). Zepto
// does not sign payloads, so this shared secret is the only auth.
// Hard bounces go straight to the platform suppression list; soft bounces are
// only logged (mailbox-full etc. usually recovers).

// Zepto nests recipients differently per event version — walk the payload and
// collect every event name + bounced/recipient address we can find.
function collect(node: unknown, names: Set<string>, recipients: Map<string, string>, reason: { text: string }) {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, names, recipients, reason)
    return
  }
  if (!node || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'event_name') {
      if (typeof value === 'string') names.add(value.toLowerCase())
      if (Array.isArray(value)) for (const v of value) if (typeof v === 'string') names.add(v.toLowerCase())
    } else if (key === 'bounced_recipient' && typeof value === 'string' && value.includes('@')) {
      recipients.set(value.toLowerCase(), reason.text)
    } else if (key === 'reason' && typeof value === 'string') {
      reason.text = value
    } else {
      collect(value, names, recipients, reason)
    }
  }
}

export async function POST(req: NextRequest) {
  // Zepto's own "Verify" reachability probe sends no body/auth (its panel
  // says "API call should be unauthenticated") — always parse first so that
  // probe gets a clean 200 before any secret check runs. Real bounce events
  // are checked for the shared secret only once we have JSON to act on.
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ success: true, message: 'ignored non-JSON body' })
  }

  const secret = process.env.ZEPTOMAIL_WEBHOOK_SECRET
  if (secret) {
    const provided =
      req.headers.get('x-webhook-key') ?? req.nextUrl.searchParams.get('key')
    if (provided !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  try {
    const names = new Set<string>()
    const recipients = new Map<string, string>()
    collect(payload, names, recipients, { text: '' })

    const isHard = names.has('hardbounce')
    console.log(
      `[ZeptoMail Webhook] events=${[...names].join(',') || 'none'} recipients=${recipients.size}`
    )

    if (isHard) {
      for (const [email, reason] of recipients) {
        await suppressEmail(email, 'hardbounce', 'zeptomail-webhook', reason || undefined)
        console.log(`[ZeptoMail Webhook] suppressed hard-bounced address: ${email}`)
      }
    }

    return NextResponse.json({ success: true, suppressed: isHard ? recipients.size : 0 })
  } catch (error: unknown) {
    console.error('[ZeptoMail Webhook] processing error:', error)
    // 200 so Zepto doesn't retry a payload we'll never parse.
    return NextResponse.json({ success: true, error: 'processing error' })
  }
}
