export type AddonWallet = {
  channel: 'SMS' | 'WHATSAPP'
  freeAllowance: number
  freeUsed: number
  freeRemaining: number
  purchasedBalance: number
  totalAvailable: number
  periodStart: string
}

export type AddonProvider = {
  configured: boolean
  status?: 'DRAFT' | 'VERIFIED' | 'DISABLED'
  provider?: string
  authKeyLast4?: string | null
  senderId?: string | null
  smsFlowId?: string | null
  whatsappNumber?: string | null
  verifiedAt?: string | null
}

export type CreditPack = {
  id: string
  channel: 'SMS' | 'WHATSAPP'
  credits: number
  priceInr: number
}

export type Addon = {
  slug: string
  name: string
  description: string
  channel: 'SMS' | 'WHATSAPP' | null
  selfServe: boolean
  enabled: boolean
  wallet: AddonWallet | null
  provider: AddonProvider
  packs: CreditPack[]
}

export type AddonsResponse = {
  success: boolean
  data: { addons: Addon[] }
}
