// THE entry point for org-attributed transactional SMS/WhatsApp sends
// (fee reminders, invoice notifications, and any future per-org messaging).
// Resolves bring-your-own credentials first; on the Vidhyaan account each
// message debits 1 credit and throws InsufficientCreditsError at zero
// balance. Login/OTP messages must NOT go through here — they are a
// platform cost and never metered.

import type { MessageChannel } from '@prisma/client'
import { sendCampaignSMS, sendCampaignWhatsApp } from '@/lib/campaign/channels'
import { spendCredits } from './engine'
import { getActiveProviderConfig } from './provider'

export async function sendMeteredSms(
  orgId: string,
  to: string,
  body: string,
  ref?: string
): Promise<void> {
  const byo = await getActiveProviderConfig(orgId, 'SMS' as MessageChannel)
  if (!byo) {
    await spendCredits(orgId, 'SMS' as MessageChannel, 1, ref)
  }
  await sendCampaignSMS({
    to,
    body,
    credentials: byo
      ? { authKey: byo.authKey, senderId: byo.senderId, flowId: byo.smsFlowId }
      : undefined
  })
}

export async function sendMeteredWhatsApp(
  orgId: string,
  to: string,
  templateId: string,
  body: string,
  ref?: string
): Promise<void> {
  const byo = await getActiveProviderConfig(orgId, 'WHATSAPP' as MessageChannel)
  if (!byo) {
    await spendCredits(orgId, 'WHATSAPP' as MessageChannel, 1, ref)
  }
  await sendCampaignWhatsApp({
    to,
    templateId,
    body,
    credentials: byo
      ? { authKey: byo.authKey, whatsappNumber: byo.whatsappNumber }
      : undefined
  })
}
