import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db/client'
import { getMetaWhatsAppConfig } from '@/lib/platform-config'
import { sendMetaTextMessage } from '@/lib/integrations/meta-whatsapp'
import { createNotification } from '@/lib/services/notifications'
import { getAlertChannels } from '@/lib/platform-config'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { refundCredits } from '@/lib/credits/engine'

// Meta WhatsApp Cloud API webhook: delivery statuses, inbound messages,
// STOP/START consent management. Configure in the Meta App dashboard →
// WhatsApp → Configuration (callback URL + verify token, subscribe to the
// `messages` field). Always answer 200 fast — Meta retries aggressively and
// disables webhooks that keep failing.

export const maxDuration = 60

const STOP_WORDS = /^\s*(stop|unsubscribe|opt\s*out|no more|block)\s*$/i
const START_WORDS = /^\s*(start|resume|subscribe|unstop)\s*$/i

const STATUS_MAP: Record<string, string> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED'
}
// Never downgrade (Meta can deliver webhooks out of order)
const STATUS_RANK: Record<string, number> = {
  ACCEPTED: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4
}

/** GET — Meta's subscribe handshake. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const cfg = await getMetaWhatsAppConfig()
  if (mode === 'subscribe' && cfg.webhookVerifyToken && token === cfg.webhookVerifyToken) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/** POST — status updates + inbound messages. Signature-verified, fail-closed. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const cfg = await getMetaWhatsAppConfig()
  if (!cfg.appSecret) {
    // Without the app secret we cannot authenticate the caller — reject.
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }
  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const expected =
    'sha256=' + crypto.createHmac('sha256', cfg.appSecret).update(rawBody).digest('hex')
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  try {
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value
        if (!value) continue
        if (change?.field === 'message_template_status_update') {
          await processTemplateStatusUpdate(value)
          continue
        }
        await processStatuses(value.statuses ?? [])
        await processInbound(value.messages ?? [], cfg)
      }
    }
  } catch (err) {
    // Log but still 200 — a poison message must not stall Meta's queue
    console.error('Meta webhook processing error:', err)
  }

  return NextResponse.json({ ok: true })
}

/**
 * Meta paused/disabled/rejected a template (usually quality-based, hits
 * marketing templates). Pull it from the shared catalog so schools stop
 * selecting it, and alert ops — sends via it start failing immediately.
 */
async function processTemplateStatusUpdate(value: any): Promise<void> {
  const event: string = String(value?.event ?? '').toUpperCase()
  const name: string | undefined = value?.message_template_name
  if (!name) return

  const badEvents = ['PAUSED', 'DISABLED', 'REJECTED', 'FLAGGED']
  if (badEvents.includes(event)) {
    await prisma.sharedWhatsappTemplate.updateMany({
      where: { msg91TemplateId: name, deletedAt: null },
      data: { isActive: false }
    })
  }

  // Ops alert for every lifecycle event (APPROVED included — signals a
  // pending template like review_request just went live)
  const { opsAlertEmail } = await getAlertChannels()
  if (opsAlertEmail) {
    const reason = value?.reason ?? value?.other_info?.description ?? '—'
    await sendTransactionalEmail({
      to: opsAlertEmail,
      toName: 'Vidhyaan Ops',
      subject: `WhatsApp template ${event}: ${name}`,
      htmlBody: `<p>Meta reports template <strong>${name}</strong> (${value?.message_template_language ?? ''}) is now <strong>${event}</strong>.</p>
<p>Reason: ${reason}</p>
<p>${badEvents.includes(event) ? 'It has been removed from the shared catalog automatically. Fix it in WhatsApp Manager, then re-sync and reactivate.' : 'If it was pending (e.g. review_request), run Sync from Meta in the admin catalog to publish it.'}</p>`
    }).catch(err => console.error('Template-status ops alert failed:', err))
  }
}

/**
 * Refunds 1 credit-message for a campaign recipient the async delivery
 * webhook just reported FAILED (billed at send time, never refunded since
 * it wasn't a synchronous failure). Skips entirely if the campaign used a
 * BYO provider — proven by the absence of a SEND ledger entry for it, since
 * BYO sends never touch the wallet. Refunds into purchasedBalance rather
 * than reconstructing the original free/purchased split per-message (that
 * split was only ever recorded in aggregate for the whole campaign) — the
 * org gets the credit back either way, this just isn't precise about which
 * bucket it re-lands in.
 */
async function refundLateFailure(orgId: string, campaignId: string): Promise<void> {
  const spendLedger = await prisma.messageCreditLedger.findFirst({
    where: { orgId, ref: campaignId, reason: 'SEND', channel: 'WHATSAPP' }
  })
  if (!spendLedger) return // BYO campaign — wallet was never debited

  // Derive what was actually charged per recipient at send time, instead of
  // re-deriving the template's CURRENT metaCategory — if the category
  // changed between send and this later delivery-failure webhook (org
  // admin/catalog edit), re-deriving would over- or under-refund relative
  // to what the org was actually billed.
  const recipientCount = await prisma.campaignRecipient.count({ where: { campaignId } })
  const totalDebited = Math.abs(Number(spendLedger.delta))
  const creditsPerMessage = recipientCount > 0 ? Math.round(totalDebited / recipientCount) : 1

  await refundCredits(
    orgId,
    'WHATSAPP',
    creditsPerMessage,
    { fromFree: 0, fromPurchased: creditsPerMessage },
    campaignId
  )
}

async function processStatuses(statuses: any[]): Promise<void> {
  for (const s of statuses) {
    const wamid: string | undefined = s?.id
    const mapped = STATUS_MAP[s?.status]
    if (!wamid || !mapped) continue

    const error = s?.errors?.[0]
      ? `${s.errors[0].code}: ${s.errors[0].title ?? s.errors[0].message ?? ''}`.slice(0, 500)
      : undefined

    const msg = await prisma.whatsappMessage.findUnique({ where: { wamid } })
    if (msg && STATUS_RANK[mapped] > (STATUS_RANK[msg.status] ?? 0)) {
      await prisma.whatsappMessage.update({
        where: { wamid },
        data: { status: mapped, ...(error ? { error } : {}) }
      })
    }

    // Campaign recipients track delivery/read/failure in their own row
    const recipient = await prisma.campaignRecipient.findFirst({
      where: { providerMessageId: wamid },
      select: { id: true, status: true, orgId: true, campaignId: true }
    })
    if (recipient) {
      const at = s?.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date()
      if (mapped === 'DELIVERED') {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { deliveredAt: at, ...(recipient.status === 'SENT' ? { status: 'DELIVERED' } : {}) }
        })
      } else if (mapped === 'READ') {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            readAt: at,
            ...(recipient.status === 'SENT' || recipient.status === 'DELIVERED'
              ? { status: 'READ' }
              : {})
          }
        })
      } else if (mapped === 'FAILED' && recipient.status !== 'FAILED') {
        // Guarded on status !== FAILED so a duplicate delivery of this same
        // webhook can't double-refund. A message accepted by the API and
        // billed upfront, but later reported failed by the carrier, was
        // never refunded anywhere else — the campaign-send route's refund
        // only covers synchronous failures (no wamid ever assigned, so this
        // handler never sees those rows at all).
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', failureReason: error ?? 'Delivery failed' }
        })
        await refundLateFailure(recipient.orgId, recipient.campaignId).catch(err =>
          console.error('Late-failure credit refund failed:', err)
        )
      }
    }
  }
}

async function processInbound(
  messages: any[],
  cfg: { accessToken: string | null; phoneNumberId: string | null }
): Promise<void> {
  for (const m of messages) {
    const from: string = String(m?.from ?? '')
    const phone = from.replace(/\D/g, '').slice(-10)
    if (phone.length !== 10) continue

    const body: string =
      m?.text?.body ?? m?.button?.text ?? m?.interactive?.button_reply?.title ?? ''

    // Consent management on the shared sender identity
    if (STOP_WORDS.test(body)) {
      await prisma.whatsappOptOut.upsert({
        where: { phone },
        create: { phone },
        update: {}
      })
      await reply(cfg, from, 'You will no longer receive WhatsApp updates from us. Reply START anytime to resume.')
      continue
    }
    if (START_WORDS.test(body)) {
      await prisma.whatsappOptOut.deleteMany({ where: { phone } })
      await reply(cfg, from, 'You will now receive WhatsApp updates again. Reply STOP anytime to unsubscribe.')
      continue
    }

    // Regular reply — store it and surface to the most likely org
    const lastOutbound = await prisma.whatsappMessage.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      select: { orgId: true }
    })

    // A duplicate webhook redelivery hits the wamid unique constraint here —
    // that used to be swallowed and execution fell straight through to the
    // staff-notification block below regardless, so a Meta retry produced a
    // fresh "WhatsApp reply received" alert every time even though nothing
    // new was stored. Only notify on a genuine first insert.
    let isNewInbound = true
    await prisma.whatsappInboundMessage
      .create({
        data: {
          wamid: m?.id ?? null,
          phone,
          body: body.slice(0, 2000) || `[${m?.type ?? 'unsupported'} message]`,
          orgId: lastOutbound?.orgId ?? null
        }
      })
      .catch(() => { isNewInbound = false })

    if (isNewInbound && lastOutbound?.orgId) {
      const admins = await prisma.user.findMany({
        where: {
          orgId: lastOutbound.orgId,
          deletedAt: null,
          status: 'ACTIVE',
          roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }
        },
        select: { id: true },
        take: 3
      })
      for (const admin of admins) {
        await createNotification({
          orgId: lastOutbound.orgId,
          recipientType: 'USER',
          recipientId: admin.id,
          type: 'WHATSAPP_REPLY',
          title: 'WhatsApp reply received',
          body: `${phone}: ${body.slice(0, 140) || '(non-text message)'}`,
          data: { phone },
          suppressEmail: true
        } as any).catch(() => {})
      }
    }
  }
}

async function reply(
  cfg: { accessToken: string | null; phoneNumberId: string | null },
  to: string,
  body: string
): Promise<void> {
  if (!cfg.accessToken || !cfg.phoneNumberId) return
  await sendMetaTextMessage({
    to,
    body,
    accessToken: cfg.accessToken,
    phoneNumberId: cfg.phoneNumberId
  }).catch(err => console.error('Opt-out reply failed:', err?.message))
}
