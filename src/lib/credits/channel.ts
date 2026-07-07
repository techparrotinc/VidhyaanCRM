import { Errors } from '@/lib/api/errors'
import type { MessageChannel } from '@prisma/client'

/** Parses a [channel] route param ('sms' | 'whatsapp') into the enum. */
export function parseChannel(raw: string | undefined): MessageChannel {
  const upper = (raw ?? '').toUpperCase()
  if (upper !== 'SMS' && upper !== 'WHATSAPP') {
    throw Errors.validation({ channel: ['Must be sms or whatsapp'] })
  }
  return upper as MessageChannel
}
