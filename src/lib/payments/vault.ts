import crypto from 'crypto'

/**
 * CredentialVault — encryption at rest for per-school gateway secrets.
 *
 * AES-256-GCM (authenticated: tampered ciphertext throws, unlike the legacy
 * CBC helper in src/lib/integrations/razorpay). Keys come from env:
 *
 *   PAYMENT_ENCRYPTION_KEY      base64, 32 bytes  (version 1)
 *   PAYMENT_ENCRYPTION_KEY_V2   base64, 32 bytes  (added on rotation)
 *
 * Ciphertext format: v{version}:{iv}:{authTag}:{ciphertext}  (base64 fields).
 * Rotation: add the next key version env, bump CURRENT via
 * PAYMENT_ENCRYPTION_KEY_CURRENT, re-encrypt lazily on write. Decryption
 * routes by the version prefix, so old ciphertexts keep working.
 *
 * Fail-closed: no fallback keys, no defaults. Missing/malformed key env
 * throws on first use.
 */

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12
const KEY_BYTES = 32

export class VaultError extends Error {}

function envNameForVersion(version: number): string {
  return version === 1 ? 'PAYMENT_ENCRYPTION_KEY' : `PAYMENT_ENCRYPTION_KEY_V${version}`
}

function keyForVersion(version: number): Buffer {
  const envName = envNameForVersion(version)
  const raw = process.env[envName]
  if (!raw) {
    throw new VaultError(`${envName} is not set — payment secrets cannot be processed`)
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_BYTES) {
    throw new VaultError(`${envName} must be ${KEY_BYTES} bytes base64-encoded (got ${key.length})`)
  }
  return key
}

export function currentKeyVersion(): number {
  const raw = process.env.PAYMENT_ENCRYPTION_KEY_CURRENT
  if (!raw) return 1
  const version = Number(raw)
  if (!Number.isInteger(version) || version < 1) {
    throw new VaultError('PAYMENT_ENCRYPTION_KEY_CURRENT must be a positive integer')
  }
  return version
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) {
    throw new VaultError('Cannot encrypt an empty secret')
  }
  const version = currentKeyVersion()
  const key = keyForVersion(version)
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `v${version}:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`
}

export function decryptSecret(encrypted: string): string {
  const parts = encrypted.split(':')
  if (parts.length !== 4 || !/^v\d+$/.test(parts[0])) {
    throw new VaultError('Malformed vault ciphertext')
  }
  const version = Number(parts[0].slice(1))
  const key = keyForVersion(version)
  const iv = Buffer.from(parts[1], 'base64')
  const authTag = Buffer.from(parts[2], 'base64')
  const ciphertext = Buffer.from(parts[3], 'base64')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    // GCM auth failure — tampered ciphertext or wrong key. Never partial output.
    throw new VaultError('Vault ciphertext failed authentication')
  }
}

/** Version embedded in a ciphertext — for lazy re-encryption sweeps. */
export function ciphertextKeyVersion(encrypted: string): number {
  const match = /^v(\d+):/.exec(encrypted)
  if (!match) {
    throw new VaultError('Malformed vault ciphertext')
  }
  return Number(match[1])
}
