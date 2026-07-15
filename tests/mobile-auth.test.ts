import { describe, it, expect, beforeAll } from 'vitest'
import {
  signMobileAccessToken,
  verifyMobileAccessToken,
  signIntermediateToken,
  verifyIntermediateToken
} from '@/lib/mobile-auth/jwt'
import {
  decideRotation,
  hashToken,
  generateRefreshToken,
  timingSafeEqualHex
} from '@/lib/mobile-auth/refresh'

beforeAll(() => {
  process.env.MOBILE_JWT_SECRET = 'test-secret-test-secret-test-secret-1234'
})

const CLAIMS = {
  userId: 'user_1',
  role: 'ORG_ADMIN',
  orgId: 'org_1',
  name: 'Test User',
  assignmentId: 'ura_1',
  deviceId: 'device_abc'
}

describe('mobile access JWT', () => {
  it('round-trips all claims', async () => {
    const token = await signMobileAccessToken(CLAIMS)
    const back = await verifyMobileAccessToken(token)
    expect(back).toEqual(CLAIMS)
  })

  it('rejects an expired token', async () => {
    const token = await signMobileAccessToken(CLAIMS, -10)
    expect(await verifyMobileAccessToken(token)).toBeNull()
  })

  it('rejects garbage and tampered tokens', async () => {
    expect(await verifyMobileAccessToken('not-a-jwt')).toBeNull()
    const token = await signMobileAccessToken(CLAIMS)
    const [h, p, s] = token.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), role: 'SUPER_ADMIN' })
    ).toString('base64url')
    expect(await verifyMobileAccessToken(`${h}.${tamperedPayload}.${s}`)).toBeNull()
  })

  it('keeps null orgId for platform users', async () => {
    const token = await signMobileAccessToken({ ...CLAIMS, orgId: null })
    const back = await verifyMobileAccessToken(token)
    expect(back?.orgId).toBeNull()
  })

  it('never accepts an intermediate token as an access token (typ gate)', async () => {
    const sel = await signIntermediateToken('select', { userId: 'u', deviceId: 'd' })
    const chal = await signIntermediateToken('2fa', { userId: 'u', deviceId: 'd' })
    expect(await verifyMobileAccessToken(sel)).toBeNull()
    expect(await verifyMobileAccessToken(chal)).toBeNull()
  })

  it('intermediate tokens verify only for their own purpose', async () => {
    const sel = await signIntermediateToken('select', { userId: 'u', deviceId: 'd', assignmentId: 'a' })
    expect(await verifyIntermediateToken(sel, 'select')).toEqual({
      userId: 'u',
      deviceId: 'd',
      assignmentId: 'a'
    })
    expect(await verifyIntermediateToken(sel, '2fa')).toBeNull()
    const access = await signMobileAccessToken(CLAIMS)
    expect(await verifyIntermediateToken(access, 'select')).toBeNull()
  })
})

describe('refresh rotation decision', () => {
  const future = new Date(Date.now() + 1000 * 60 * 60)
  const past = new Date(Date.now() - 1000)
  const current = generateRefreshToken()
  const previous = generateRefreshToken()
  const stored = {
    refreshTokenHash: hashToken(current),
    prevRefreshTokenHash: hashToken(previous),
    refreshExpiresAt: future,
    revokedAt: null as Date | null
  }

  it('rotates on the current token', () => {
    expect(decideRotation(hashToken(current), stored)).toBe('rotate')
  })

  it('flags reuse on the previous token — leaked-token signal', () => {
    expect(decideRotation(hashToken(previous), stored)).toBe('reuse-detected')
  })

  it('rejects an unknown token', () => {
    expect(decideRotation(hashToken(generateRefreshToken()), stored)).toBe('reject')
  })

  it('rejects when expired, revoked, or never issued', () => {
    expect(decideRotation(hashToken(current), { ...stored, refreshExpiresAt: past })).toBe('reject')
    expect(decideRotation(hashToken(current), { ...stored, revokedAt: new Date() })).toBe('reject')
    expect(
      decideRotation(hashToken(current), {
        refreshTokenHash: null,
        prevRefreshTokenHash: null,
        refreshExpiresAt: null,
        revokedAt: null
      })
    ).toBe('reject')
  })

  it('expired reuse still rejects (no revocation storm on stale devices)', () => {
    expect(decideRotation(hashToken(previous), { ...stored, refreshExpiresAt: past })).toBe('reject')
  })
})

describe('token hashing', () => {
  it('produces 64-hex sha256 and distinct tokens', () => {
    const a = generateRefreshToken()
    const b = generateRefreshToken()
    expect(a).not.toBe(b)
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashToken(a)).not.toBe(hashToken(b))
  })

  it('timing-safe compare handles length mismatch', () => {
    expect(timingSafeEqualHex('aa', 'aaaa')).toBe(false)
    expect(timingSafeEqualHex(hashToken('x'), hashToken('x'))).toBe(true)
  })
})
