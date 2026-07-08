import { Errors } from '@/lib/api/errors'
import type { MessageChannel } from '@prisma/client'

/** Parses a [channel] route param ('sms' | 'whatsapp' | 'ai') into the enum. */
export function parseChannel(raw: string | undefined): MessageChannel {
  const upper = (raw ?? '').toUpperCase()
  if (upper !== 'SMS' && upper !== 'WHATSAPP' && upper !== 'AI') {
    throw Errors.validation({ channel: ['Must be sms, whatsapp or ai'] })
  }
  return upper as MessageChannel
}

/** Channels with a BYO provider option (MSG91). AI has no BYO equivalent. */
export function isMessagingChannel(channel: MessageChannel): boolean {
  return channel === 'SMS' || channel === 'WHATSAPP'
}
