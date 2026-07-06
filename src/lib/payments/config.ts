import crypto from 'crypto'
import { GatewayEnvironment, GatewayProvider, GatewayConfigStatus, AuditAction, type PaymentGatewayConfig } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { OrgScopedClient } from '@/lib/db/tenant'
import { encryptSecret, decryptSecret, currentKeyVersion } from './vault'
import { getProvider } from './registry'
import type { DecryptedCredentials } from './provider'

/**
 * Gateway config lifecycle for the settings surface. Secrets never leave this
 * module in plaintext except as DecryptedCredentials handed to a provider.
 */

export type MaskedGatewayConfig = {
  id: string
  provider: GatewayProvider
  environment: GatewayEnvironment
  status: GatewayConfigStatus
  isCurrent: boolean
  keyIdLast4: string | null
  allowPartial: boolean
  minPartialAmount: string | null
  verifiedAt: Date | null
  webhookVerifiedAt: Date | null
  lastWebhookAt: Date | null
  updatedAt: Date
}

export function maskConfig(config: PaymentGatewayConfig): MaskedGatewayConfig {
  return {
    id: config.id,
    provider: config.provider,
    environment: config.environment,
    status: config.status,
    isCurrent: config.isCurrent,
    keyIdLast4: config.keyIdLast4,
    allowPartial: config.allowPartial,
    minPartialAmount: config.minPartialAmount?.toString() ?? null,
    verifiedAt: config.verifiedAt,
    webhookVerifiedAt: config.webhookVerifiedAt,
    lastWebhookAt: config.lastWebhookAt,
    updatedAt: config.updatedAt
  }
}

export function webhookUrlFor(orgId: string, provider: GatewayProvider): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.vidhyaan.com'
  return `${base}/api/webhooks/payments/${provider.toLowerCase()}/${orgId}`
}

export function decryptCredentials(config: PaymentGatewayConfig): DecryptedCredentials {
  return {
    keyId: decryptSecret(config.keyIdEncrypted),
    keySecret: decryptSecret(config.keySecretEncrypted)
  }
}

/**
 * Save (or replace) credentials for one environment. Always resets the config
 * to DRAFT and rotates the webhook secret — new keys mean prior verification
 * no longer proves anything. Returns the plaintext webhook secret exactly
 * once, for the admin to paste into the provider dashboard.
 */
export async function saveCredentials(
  db: OrgScopedClient,
  input: {
    orgId: string
    provider: GatewayProvider
    environment: GatewayEnvironment
    keyId: string
    keySecret: string
    createdById: string
  }
): Promise<{ config: PaymentGatewayConfig; webhookSecret: string }> {
  const webhookSecret = 'whsec_' + crypto.randomBytes(24).toString('hex')

  const data = {
    keyIdEncrypted: encryptSecret(input.keyId),
    keySecretEncrypted: encryptSecret(input.keySecret),
    webhookSecretEnc: encryptSecret(webhookSecret),
    encryptionKeyVer: currentKeyVersion(),
    keyIdLast4: input.keyId.slice(-4),
    status: GatewayConfigStatus.DRAFT,
    isCurrent: false,
    verifiedAt: null,
    webhookVerifiedAt: null,
    deletedAt: null
  }

  // deletedAt: {} opts out of the tenant client's soft-delete filter — a
  // previously disabled config must be found and revived, or create would
  // hit the (orgId, provider, environment) unique constraint.
  const existing = await db.paymentGatewayConfig.findFirst({
    where: { provider: input.provider, environment: input.environment, deletedAt: {} }
  })

  const config = existing
    ? await db.paymentGatewayConfig.update({ where: { id: existing.id }, data })
    : await db.paymentGatewayConfig.create({
        // orgId is also injected by the tenant client; passing it explicitly
        // satisfies the unchecked-create type.
        data: { ...data, orgId: input.orgId, provider: input.provider, environment: input.environment, createdById: input.createdById }
      })

  return { config, webhookSecret }
}

/** Credential check against the live provider API. DRAFT → VERIFIED on success. */
export async function verifyConfigCredentials(
  db: OrgScopedClient,
  config: PaymentGatewayConfig
): Promise<{ ok: boolean; error?: string; config: PaymentGatewayConfig }> {
  const provider = getProvider(config.provider)
  const result = await provider.verifyCredentials(decryptCredentials(config))
  if (!result.ok) {
    return { ok: false, error: result.error, config }
  }
  const updated = await db.paymentGatewayConfig.update({
    where: { id: config.id },
    data: {
      verifiedAt: new Date(),
      status: config.status === GatewayConfigStatus.DRAFT ? GatewayConfigStatus.VERIFIED : config.status
    }
  })
  return { ok: true, config: updated }
}

export async function writeGatewayAudit(input: {
  userId: string
  orgId: string
  action: AuditAction
  entityId: string
  req: Request
  after?: Record<string, unknown>
}): Promise<void> {
  // Fire-and-forget style caller; failures logged, never block the mutation.
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      orgId: input.orgId,
      action: input.action,
      entityType: 'PAYMENT_GATEWAY_CONFIG',
      entityId: input.entityId,
      ipAddress: input.req.headers.get('x-forwarded-for') ?? null,
      userAgent: input.req.headers.get('user-agent') ?? null,
      after: input.after as never
    }
  }).catch(err => console.error('[payments] audit log write failed:', err))
}
