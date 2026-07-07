// Credit pack catalog — placeholder prices, edit here when pricing is final.

export type CreditChannel = 'SMS' | 'WHATSAPP'

export interface CreditPack {
  id: string
  channel: CreditChannel
  credits: number
  priceInr: number
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'sms_100', channel: 'SMS', credits: 100, priceInr: 25 },
  { id: 'sms_500', channel: 'SMS', credits: 500, priceInr: 100 },
  { id: 'sms_1000', channel: 'SMS', credits: 1000, priceInr: 180 },
  { id: 'wa_100', channel: 'WHATSAPP', credits: 100, priceInr: 75 },
  { id: 'wa_500', channel: 'WHATSAPP', credits: 500, priceInr: 350 },
  { id: 'wa_1000', channel: 'WHATSAPP', credits: 1000, priceInr: 650 }
]

export const DEFAULT_FREE_ALLOWANCE = 25

export const getPack = (id: string) => CREDIT_PACKS.find(p => p.id === id)

export const packsForChannel = (channel: CreditChannel) =>
  CREDIT_PACKS.filter(p => p.channel === channel)
