import { describe, it, expect } from 'vitest'
import { generate as otpGenerate } from 'otplib'
import bcrypt from 'bcryptjs'
import {
  generateTotpSecret,
  buildOtpAuthUri,
  verifyTotpCode,
  generateBackupCodes
} from '@/lib/auth/twofactor'

describe('TOTP secret + URI', () => {
  it('generates a non-empty base32 secret', () => {
    const s = generateTotpSecret()
    expect(s.length).toBeGreaterThan(0)
    expect(/^[A-Z2-7]+$/.test(s)).toBe(true)
  })

  it('builds an otpauth URI with issuer + account', () => {
    const uri = buildOtpAuthUri('JBSWY3DPEHPK3PXP', 'user@example.com')
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain('Vidhyaan')
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
  })
})

describe('verifyTotpCode', () => {
  it('accepts the current code for the secret', async () => {
    const secret = generateTotpSecret()
    const token = await otpGenerate({ secret })
    expect(await verifyTotpCode(token, secret)).toBe(true)
  })

  it('tolerates surrounding whitespace', async () => {
    const secret = generateTotpSecret()
    const token = await otpGenerate({ secret })
    expect(await verifyTotpCode(`  ${token} `, secret)).toBe(true)
  })

  it('rejects a wrong code', async () => {
    const secret = generateTotpSecret()
    const token = await otpGenerate({ secret })
    const wrong = token === '000000' ? '111111' : '000000'
    expect(await verifyTotpCode(wrong, secret)).toBe(false)
  })

  it('rejects non-6-digit input', async () => {
    const secret = generateTotpSecret()
    expect(await verifyTotpCode('12345', secret)).toBe(false)
    expect(await verifyTotpCode('abcdef', secret)).toBe(false)
    expect(await verifyTotpCode('', secret)).toBe(false)
  })

  it('rejects a code minted for a different secret', async () => {
    const a = generateTotpSecret()
    const b = generateTotpSecret()
    const tokenForA = await otpGenerate({ secret: a })
    // Extremely unlikely two random secrets collide on the same window.
    expect(await verifyTotpCode(tokenForA, b)).toBe(false)
  })
})

describe('generateBackupCodes', () => {
  it('produces 10 unique formatted codes with matching hashes', async () => {
    const { plaintext, hashes } = await generateBackupCodes()
    expect(plaintext).toHaveLength(10)
    expect(hashes).toHaveLength(10)
    expect(new Set(plaintext).size).toBe(10)
    for (const c of plaintext) {
      expect(/^[0-9A-F]{5}-[0-9A-F]{5}$/.test(c)).toBe(true)
    }
  })

  it('hashes verify against their plaintext and reject others', async () => {
    const { plaintext, hashes } = await generateBackupCodes()
    expect(await bcrypt.compare(plaintext[0], hashes[0])).toBe(true)
    expect(await bcrypt.compare(plaintext[1], hashes[0])).toBe(false)
  })
})
