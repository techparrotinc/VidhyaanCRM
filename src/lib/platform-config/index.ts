import { prisma } from '@/lib/db'
import { decryptSecret } from '@/lib/payments/vault'

/**
 * Platform integration config resolver.
 *
 * Single source of truth for platform-level integration credentials, managed
 * in the admin portal. Every getter follows the same rule:
 *
 *     DB value (decrypted) if present  →  else process.env fallback
 *
 * so an empty PlatformSettings row behaves EXACTLY like today's env-only setup.
 * That fail-open-to-env design is what keeps this safe to roll out: nothing
 * changes until an admin actually saves a value.
 *
 * The settings row is cached in-memory for a short TTL; mutations to settings
 * call invalidatePlatformConfigCache().
 */

type SettingsRow = Awaited<ReturnType<typeof prisma.platformSettings.findUnique>>

let cache: { row: SettingsRow; at: number } | null = null
const TTL_MS = 60_000

async function loadRow(): Promise<SettingsRow> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.row
  try {
    const row = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
    cache = { row, at: now }
    return row
  } catch {
    // If the settings row can't be read, fall through to env everywhere.
    return cache?.row ?? null
  }
}

export function invalidatePlatformConfigCache(): void {
  cache = null
}

// Guarded decrypt: never throw out of the resolver. A malformed/undecryptable
// ciphertext (e.g. missing PAYMENT_ENCRYPTION_KEY) degrades to env fallback.
function dec(cipher: string | null | undefined): string | null {
  if (!cipher) return null
  try {
    const v = decryptSecret(cipher)
    return v || null
  } catch {
    return null
  }
}

function plain(v: string | null | undefined): string | null {
  return v && v.trim() !== '' ? v : null
}

export interface RazorpayCredentials {
  keyId: string
  keySecret: string
  /** true when both values came from env fallback (nothing configured in DB) */
  fromEnv: boolean
}

export async function getRazorpayCredentials(): Promise<RazorpayCredentials> {
  const row = await loadRow()
  const dbKeyId = plain(row?.razorpayKeyId) ?? plain(row?.razorpayLiveKey)
  const dbSecret = dec(row?.razorpayKeySecretEnc)
  if (dbKeyId && dbSecret) {
    return { keyId: dbKeyId, keySecret: dbSecret, fromEnv: false }
  }
  return {
    keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
    fromEnv: true,
  }
}

export async function getRazorpayWebhookSecret(): Promise<string | null> {
  const row = await loadRow()
  return (
    dec(row?.razorpayWebhookSecretEnc) ??
    plain(row?.razorpayWebhookSecret) ??
    (process.env.RAZORPAY_WEBHOOK_SECRET || null)
  )
}

export interface StorageConfig {
  region: string
  bucket: string
  endpoint: string | null
  cdnUrl: string | null
  accessKeyId: string | null
  secretAccessKey: string | null
}

export async function getStorageConfig(): Promise<StorageConfig> {
  const row = await loadRow()
  return {
    region: plain(row?.s3Region) ?? process.env.AWS_REGION ?? 'ap-south-1',
    bucket: plain(row?.doSpacesBucket) ?? process.env.S3_BUCKET_NAME ?? '',
    endpoint: plain(row?.doSpacesEndpoint) ?? process.env.S3_ENDPOINT ?? null,
    cdnUrl: plain(row?.doSpacesCdnUrl) ?? process.env.S3_CDN_URL ?? null,
    accessKeyId: plain(row?.s3AccessKeyId) ?? process.env.AWS_ACCESS_KEY_ID ?? null,
    secretAccessKey: dec(row?.s3SecretKeyEnc) ?? process.env.AWS_SECRET_ACCESS_KEY ?? null,
  }
}

export interface ZeptoConfig {
  token: string
  fromEmail: string
  campaignEmail: string
}

export async function getZeptoConfig(): Promise<ZeptoConfig> {
  const row = await loadRow()
  return {
    token: dec(row?.zeptoTokenEnc) ?? process.env.ZEPTOMAIL_API_TOKEN ?? '',
    fromEmail: plain(row?.zeptoFromEmail) ?? plain(row?.fromEmailAddress) ?? process.env.ZEPTOMAIL_FROM_EMAIL ?? 'noreply@vidhyaan.com',
    campaignEmail: plain(row?.zeptoCampaignEmail) ?? process.env.ZEPTOMAIL_CAMPAIGN_EMAIL ?? 'campaigns@vidhyaan.com',
  }
}

export interface Msg91Config {
  authKey: string | null
  whatsappNumber: string | null
  senderId: string | null
}

export async function getMsg91Config(): Promise<Msg91Config> {
  const row = await loadRow()
  return {
    authKey: dec(row?.msg91AuthKeyEnc) ?? process.env.MSG91_AUTH_KEY ?? null,
    whatsappNumber: plain(row?.msg91WhatsappNumber) ?? process.env.MSG91_WHATSAPP_NUMBER ?? null,
    senderId: plain(row?.msg91SenderId) ?? process.env.MSG91_SENDER_ID ?? null,
  }
}

export interface PlatformFeatureFlags {
  enableWhatsapp: boolean
  enableCampaignModule: boolean
  enableAiFeatures: boolean
  enablePublicApiAccess: boolean
  maintenanceMode: boolean
}

export async function getFeatureFlags(): Promise<PlatformFeatureFlags> {
  const row = await loadRow()
  return {
    enableWhatsapp: !!row?.enableWhatsapp,
    enableCampaignModule: !!row?.enableCampaignModule,
    enableAiFeatures: !!row?.enableAiFeatures,
    enablePublicApiAccess: !!row?.enablePublicApiAccess,
    maintenanceMode: !!row?.maintenanceMode,
  }
}

/** Optional external uptime monitor key (UptimeRobot). */
export async function getUptimeRobotKey(): Promise<string | null> {
  const row = await loadRow()
  return dec(row?.uptimeRobotApiKeyEnc) ?? process.env.UPTIMEROBOT_API_KEY ?? null
}

/** Alerts channels — ops email + optional Slack webhook. */
export async function getAlertChannels(): Promise<{ opsAlertEmail: string | null; slackWebhookUrl: string | null }> {
  const row = await loadRow()
  return {
    opsAlertEmail: plain(row?.opsAlertEmail) ?? process.env.OPS_ALERT_EMAIL ?? null,
    slackWebhookUrl: plain(row?.slackWebhookUrl) ?? process.env.SLACK_WEBHOOK_URL ?? null,
  }
}
