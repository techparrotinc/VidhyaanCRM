import { MODULES } from './modules'

// Catalog of purchasable/configurable add-ons shown in Settings → Add-ons.
// Future add-ons: append an entry here; the settings API and UI render
// from this list.

export type AddonChannel = 'SMS' | 'WHATSAPP' | 'AI'

export interface AddonDefinition {
  slug: string
  name: string
  description: string
  /** Messaging channel this addon meters; null for non-messaging add-ons. */
  channel: AddonChannel | null
  /** Orgs can request activation (platform admin enables) vs enabled by default. */
  selfServe: boolean
}

export const ADDONS: AddonDefinition[] = [
  {
    slug: MODULES.SMS_ADDON,
    name: 'SMS',
    description:
      'Send SMS campaigns and fee notifications to guardians. 25 free messages every month; buy credits for more, or connect your own MSG91 account.',
    channel: 'SMS',
    selfServe: true
  },
  {
    slug: MODULES.AI_COPILOT,
    name: 'AI Copilot',
    description:
      'Vidhyaan AI answers product questions and live data queries for your team. 25 free messages every month; buy credits for more. Live-data answers use 2 credits, others 1.',
    channel: 'AI',
    selfServe: true
  },
  {
    slug: MODULES.WHATSAPP_ADDON,
    name: 'WhatsApp',
    description:
      'Send WhatsApp template messages via the Vidhyaan Business account. 25 free messages every month; buy credits for more, or connect your own account.',
    channel: 'WHATSAPP',
    selfServe: false
  }
]

export const getAddon = (slug: string) => ADDONS.find(a => a.slug === slug)
