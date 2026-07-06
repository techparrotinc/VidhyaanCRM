import { describe, it, expect, beforeAll } from 'vitest'
import crypto from 'crypto'
import { maskConfig, saveCredentials, decryptCredentials, webhookUrlFor } from '@/lib/payments/config'
import { decryptSecret } from '@/lib/payments/vault'

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY ??= crypto.randomBytes(32).toString('base64')
})

// Minimal stub standing in for the tenant-scoped client — captures writes.
function stubDb() {
  const calls: { create?: any; update?: any } = {}
  return {
    calls,
    paymentGatewayConfig: {
      findFirst: async () => null,
      create: async ({ data }: any) => {
        calls.create = data
        return { id: 'cfg_1', ...data }
      },
      update: async ({ where, data }: any) => {
        calls.update = { where, data }
        return { id: where.id, ...data }
      }
    }
  } as any
}

describe('saveCredentials', () => {
  it('encrypts everything, resets to DRAFT, returns webhook secret once', async () => {
    const db = stubDb()
    const { config, webhookSecret } = await saveCredentials(db, {
      orgId: 'org_test',
      provider: 'RAZORPAY',
      environment: 'TEST',
      keyId: 'rzp_test_A1b2C3d4E5f6',
      keySecret: 'super_secret_value',
      createdById: 'user_1'
    })

    expect(webhookSecret).toMatch(/^whsec_[0-9a-f]{48}$/)
    expect(config.status).toBe('DRAFT')
    expect(config.isCurrent).toBe(false)
    expect(config.keyIdLast4).toBe('E5f6')

    // Nothing stored in plaintext
    const stored = db.calls.create
    expect(stored.keyIdEncrypted).not.toContain('rzp_test')
    expect(stored.keySecretEncrypted).not.toContain('super_secret')
    expect(stored.webhookSecretEnc).not.toContain(webhookSecret)

    // But all decryptable
    expect(decryptSecret(stored.keyIdEncrypted)).toBe('rzp_test_A1b2C3d4E5f6')
    expect(decryptSecret(stored.keySecretEncrypted)).toBe('super_secret_value')
    expect(decryptSecret(stored.webhookSecretEnc)).toBe(webhookSecret)
  })

  it('roundtrips through decryptCredentials', async () => {
    const db = stubDb()
    const { config } = await saveCredentials(db, {
      orgId: 'org_test',
      provider: 'RAZORPAY',
      environment: 'LIVE',
      keyId: 'rzp_live_XyZ',
      keySecret: 'live_secret',
      createdById: 'user_1'
    })
    expect(decryptCredentials(config as any)).toEqual({
      keyId: 'rzp_live_XyZ',
      keySecret: 'live_secret'
    })
  })
})

describe('maskConfig', () => {
  it('never exposes encrypted fields', async () => {
    const db = stubDb()
    const { config } = await saveCredentials(db, {
      orgId: 'org_test',
      provider: 'RAZORPAY',
      environment: 'TEST',
      keyId: 'rzp_test_abcd1234',
      keySecret: 'shh',
      createdById: 'user_1'
    })
    const masked = maskConfig({ ...config, minPartialAmount: null, updatedAt: new Date() } as any)
    const json = JSON.stringify(masked)
    expect(json).not.toContain('Encrypted')
    expect(json).not.toContain('rzp_test_abcd1234')
    expect(json).not.toContain('shh')
    expect(masked.keyIdLast4).toBe('1234')
  })
})

describe('webhookUrlFor', () => {
  it('builds a per-org, per-provider path', () => {
    const url = webhookUrlFor('org_123', 'RAZORPAY')
    expect(url).toMatch(/\/api\/webhooks\/payments\/razorpay\/org_123$/)
  })
})
