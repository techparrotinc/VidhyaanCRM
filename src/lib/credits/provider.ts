// Bring-your-own messaging provider resolution. A VERIFIED, non-deleted
// config means the org sends through its own MSG91 account and Vidhyaan
// credits are NOT consumed.

import { prisma } from '@/lib/db/client'
import type { MessageChannel } from '@prisma/client'
import { decryptSecret } from '@/lib/payments/vault'

export interface ActiveProviderCreds {
  provider: string
  authKey: string
  senderId?: string
  smsFlowId?: string
  whatsappNumber?: string
}

export async function getActiveProviderConfig(
  orgId: string,
  channel: MessageChannel
): Promise<ActiveProviderCreds | null> {
  const config = await prisma.messagingProviderConfig.findFirst({
    where: { orgId, channel, status: 'VERIFIED', deletedAt: null }
  })
  if (!config) return null

  return {
    provider: config.provider,
    authKey: decryptSecret(config.authKeyEncrypted),
    senderId: config.senderId ?? undefined,
    smsFlowId: config.smsFlowId ?? undefined,
    whatsappNumber: config.whatsappNumber ?? undefined
  }
}
