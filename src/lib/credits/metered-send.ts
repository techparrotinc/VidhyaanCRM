// THE entry point for org-attributed transactional SMS/WhatsApp sends
// (fee reminders, invoice notifications, and any future per-org messaging).
// Resolves bring-your-own credentials first; on the Vidhyaan account each
// message debits 1 credit and throws InsufficientCreditsError at zero
// balance. Login/OTP messages must NOT go through here — they are a
// platform cost and never metered.

import type { MessageChannel } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { sendCampaignSMS, sendCampaignWhatsApp } from '@/lib/campaign/channels'
import { spendCreditsWithIntent, confirmSpendIntent, refundSpendIntent } from './engine'
import { getActiveProviderConfig } from './provider'

// Runs the actual send after a credit debit; a failed send refunds the
// credit so orgs never pay for undelivered messages. Debit is intent-tracked
// (spendCreditsWithIntent) so a crash between the debit and this confirm/
// refund still gets reconciled by the cron sweep instead of losing the
// credit silently.
async function sendWithRefund(
  intentId: string | null,
  send: () => Promise<void>
): Promise<void> {
  try {
    await send()
    if (intentId) await confirmSpendIntent(intentId)
  } catch (err) {
    if (intentId) {
      await refundSpendIntent(intentId).catch(e =>
        console.error(`sendWithRefund: refundSpendIntent(${intentId}) failed`, e)
      )
    }
    throw err
  }
}

export async function sendMeteredSms(
  orgId: string,
  to: string,
  body: string,
  ref?: string
): Promise<void> {
  const byo = await getActiveProviderConfig(orgId, 'SMS' as MessageChannel)
  const spent = byo ? null : await spendCreditsWithIntent(orgId, 'SMS' as MessageChannel, 1, ref)
  await sendWithRefund(spent?.intentId ?? null, () =>
    sendCampaignSMS({
      to,
      body,
      credentials: byo
        ? { authKey: byo.authKey, senderId: byo.senderId, flowId: byo.smsFlowId }
        : undefined
    })
  )
}

export async function sendMeteredWhatsApp(
  orgId: string,
  to: string,
  templateId: string,
  body: string,
  ref?: string,
  opts?: {
    /** Meta language code of the approved template (default en). */
    language?: string
    /** Ordered positional {{1}}..{{n}} parameters; overrides legacy body mode. */
    parameters?: string[]
    /** Credits to debit (2 for MARKETING-category templates; default 1). */
    credits?: number
  }
): Promise<void> {
  const qty = opts?.credits ?? 1
  const byo = await getActiveProviderConfig(orgId, 'WHATSAPP' as MessageChannel)
  const spent = byo ? null : await spendCreditsWithIntent(orgId, 'WHATSAPP' as MessageChannel, qty, ref)
  let wamid: string | null = null
  try {
    wamid = await sendCampaignWhatsApp({
      to,
      templateId,
      body,
      language: opts?.language,
      parameters: opts?.parameters,
      credentials: byo
        ? { authKey: byo.authKey, whatsappNumber: byo.whatsappNumber }
        : undefined
    })
  } catch (err: any) {
    if (spent) {
      await refundSpendIntent(spent.intentId).catch(e =>
        console.error(`sendMeteredWhatsApp: refundSpendIntent(${spent.intentId}) failed`, e)
      )
    }
    await prisma.whatsappMessage
      .create({
        data: {
          orgId,
          phone: to.replace(/\D/g, '').slice(-10),
          templateName: templateId,
          ref,
          status: 'FAILED',
          error: err?.message?.slice(0, 500) ?? 'send failed'
        }
      })
      .catch(() => {})
    throw err
  }

  // Outbound log — the Meta delivery webhook updates this row by wamid
  await prisma.whatsappMessage
    .create({
      data: {
        orgId,
        wamid,
        phone: to.replace(/\D/g, '').slice(-10),
        templateName: templateId,
        ref
      }
    })
    .catch(() => {})

  // Accepted by the API — settled here. If the carrier later reports
  // delivery failure, that's refunded separately by the delivery-webhook
  // handler (src/app/api/webhooks/meta-whatsapp/route.ts), not here.
  if (spent) await confirmSpendIntent(spent.intentId)
}
