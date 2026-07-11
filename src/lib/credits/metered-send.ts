// THE entry point for org-attributed transactional SMS/WhatsApp sends
// (fee reminders, invoice notifications, and any future per-org messaging).
// Resolves bring-your-own credentials first; on the Vidhyaan account each
// message debits 1 credit and throws InsufficientCreditsError at zero
// balance. Login/OTP messages must NOT go through here — they are a
// platform cost and never metered.

import type { MessageChannel } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { sendCampaignSMS, sendCampaignWhatsApp } from '@/lib/campaign/channels'
import { spendCredits, refundCredits } from './engine'
import { getActiveProviderConfig } from './provider'

// Runs the actual send after a credit debit; a failed send refunds the
// credit so orgs never pay for undelivered messages.
async function sendWithRefund(
  orgId: string,
  channel: MessageChannel,
  spent: { fromFree: number; fromPurchased: number } | null,
  ref: string | undefined,
  send: () => Promise<void>
): Promise<void> {
  try {
    await send()
  } catch (err) {
    if (spent) {
      await refundCredits(orgId, channel, 1, spent, ref).catch(() => {})
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
  const spent = byo ? null : await spendCredits(orgId, 'SMS' as MessageChannel, 1, ref)
  await sendWithRefund(orgId, 'SMS' as MessageChannel, spent, ref, () =>
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
  }
): Promise<void> {
  const byo = await getActiveProviderConfig(orgId, 'WHATSAPP' as MessageChannel)
  const spent = byo ? null : await spendCredits(orgId, 'WHATSAPP' as MessageChannel, 1, ref)
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
      await refundCredits(orgId, 'WHATSAPP' as MessageChannel, 1, spent, ref).catch(() => {})
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
}
