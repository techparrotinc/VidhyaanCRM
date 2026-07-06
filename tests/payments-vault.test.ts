import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import {
  encryptSecret,
  decryptSecret,
  currentKeyVersion,
  ciphertextKeyVersion,
  VaultError,
} from '@/lib/payments/vault'

const KEY_V1 = crypto.randomBytes(32).toString('base64')
const KEY_V2 = crypto.randomBytes(32).toString('base64')

const savedEnv: Record<string, string | undefined> = {}
const ENV_KEYS = [
  'PAYMENT_ENCRYPTION_KEY',
  'PAYMENT_ENCRYPTION_KEY_V2',
  'PAYMENT_ENCRYPTION_KEY_CURRENT',
]

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
  process.env.PAYMENT_ENCRYPTION_KEY = KEY_V1
  delete process.env.PAYMENT_ENCRYPTION_KEY_V2
  delete process.env.PAYMENT_ENCRYPTION_KEY_CURRENT
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
})

describe('vault encrypt/decrypt', () => {
  it('roundtrips a secret', () => {
    const ct = encryptSecret('rzp_test_secret_abc123')
    expect(decryptSecret(ct)).toBe('rzp_test_secret_abc123')
  })

  it('produces distinct ciphertexts for the same plaintext (random IV)', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'))
  })

  it('embeds the key version prefix', () => {
    const ct = encryptSecret('x')
    expect(ct.startsWith('v1:')).toBe(true)
    expect(ciphertextKeyVersion(ct)).toBe(1)
  })

  it('throws on tampered ciphertext (GCM auth)', () => {
    const ct = encryptSecret('secret')
    const parts = ct.split(':')
    const body = Buffer.from(parts[3], 'base64')
    body[0] ^= 0xff
    parts[3] = body.toString('base64')
    expect(() => decryptSecret(parts.join(':'))).toThrow(VaultError)
  })

  it('throws on tampered auth tag', () => {
    const ct = encryptSecret('secret')
    const parts = ct.split(':')
    const tag = Buffer.from(parts[2], 'base64')
    tag[0] ^= 0xff
    parts[2] = tag.toString('base64')
    expect(() => decryptSecret(parts.join(':'))).toThrow(VaultError)
  })

  it('rejects malformed ciphertext', () => {
    expect(() => decryptSecret('not-a-vault-string')).toThrow(VaultError)
    expect(() => decryptSecret('v1:only:three')).toThrow(VaultError)
  })

  it('rejects empty plaintext', () => {
    expect(() => encryptSecret('')).toThrow(VaultError)
  })
})

describe('vault key management (fail closed)', () => {
  it('throws when key env is missing', () => {
    delete process.env.PAYMENT_ENCRYPTION_KEY
    expect(() => encryptSecret('x')).toThrow(/PAYMENT_ENCRYPTION_KEY is not set/)
  })

  it('throws when key is the wrong length', () => {
    process.env.PAYMENT_ENCRYPTION_KEY = Buffer.from('short').toString('base64')
    expect(() => encryptSecret('x')).toThrow(/32 bytes/)
  })

  it('rotates: encrypts with v2, still decrypts v1 ciphertexts', () => {
    const v1Ciphertext = encryptSecret('old-secret')

    process.env.PAYMENT_ENCRYPTION_KEY_V2 = KEY_V2
    process.env.PAYMENT_ENCRYPTION_KEY_CURRENT = '2'

    expect(currentKeyVersion()).toBe(2)
    const v2Ciphertext = encryptSecret('new-secret')
    expect(v2Ciphertext.startsWith('v2:')).toBe(true)

    expect(decryptSecret(v1Ciphertext)).toBe('old-secret')
    expect(decryptSecret(v2Ciphertext)).toBe('new-secret')
  })

  it('rejects invalid PAYMENT_ENCRYPTION_KEY_CURRENT', () => {
    process.env.PAYMENT_ENCRYPTION_KEY_CURRENT = 'zero'
    expect(() => encryptSecret('x')).toThrow(VaultError)
  })
})
