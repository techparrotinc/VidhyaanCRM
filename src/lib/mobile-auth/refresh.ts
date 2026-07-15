import crypto from 'crypto'
import { prisma } from '@/lib/db/client'
import { revokeUser } from '@/lib/auth/roleRevocation'

/**
 * Rotating refresh tokens, one per (user, device). Raw token is returned to
 * the client exactly once; only its SHA-256 lands in the database. On every
 * refresh the token rotates; the immediately-previous hash is kept solely to
 * detect reuse — presenting it means the token leaked (or a race), and the
 * whole device session is revoked, fail closed.
 */

export const REFRESH_TTL_DAYS = 30

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex')
}

export type RotationDecision = 'rotate' | 'reuse-detected' | 'reject'

/**
 * Pure rotation decision — extracted for tests. `presentedHash` is compared
 * against the current and previous stored hashes.
 */
export function decideRotation(
  presentedHash: string,
  stored: {
    refreshTokenHash: string | null
    prevRefreshTokenHash: string | null
    refreshExpiresAt: Date | null
    revokedAt: Date | null
  },
  now: Date = new Date()
): RotationDecision {
  if (stored.revokedAt) return 'reject'
  if (!stored.refreshTokenHash || !stored.refreshExpiresAt) return 'reject'
  if (stored.refreshExpiresAt <= now) return 'reject'
  if (timingSafeEqualHex(presentedHash, stored.refreshTokenHash)) return 'rotate'
  if (
    stored.prevRefreshTokenHash &&
    timingSafeEqualHex(presentedHash, stored.prevRefreshTokenHash)
  ) {
    return 'reuse-detected'
  }
  return 'reject'
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

export interface DeviceSessionInput {
  userId: string
  deviceId: string
  platform: string
  deviceName?: string | null
  assignmentId?: string | null
}

/** Create or take over the device row and mint a fresh refresh token. */
export async function issueDeviceSession(input: DeviceSessionInput): Promise<string> {
  const raw = generateRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.mobileDevice.upsert({
    where: { userId_deviceId: { userId: input.userId, deviceId: input.deviceId } },
    create: {
      userId: input.userId,
      deviceId: input.deviceId,
      platform: input.platform,
      deviceName: input.deviceName ?? null,
      assignmentId: input.assignmentId ?? null,
      refreshTokenHash: hashToken(raw),
      prevRefreshTokenHash: null,
      refreshExpiresAt: expiresAt
    },
    update: {
      platform: input.platform,
      deviceName: input.deviceName ?? undefined,
      assignmentId: input.assignmentId ?? undefined,
      refreshTokenHash: hashToken(raw),
      prevRefreshTokenHash: null,
      refreshExpiresAt: expiresAt,
      revokedAt: null,
      lastSeenAt: new Date()
    }
  })

  return raw
}

export type RotateResult =
  | { ok: true; refreshToken: string; userId: string; assignmentId: string | null }
  | { ok: false; reason: 'invalid' | 'reuse-detected' }

/** Verify + rotate. Reuse detection revokes the device AND the user's Redis auth. */
export async function rotateDeviceSession(
  rawToken: string,
  deviceId: string
): Promise<RotateResult> {
  const presentedHash = hashToken(rawToken)
  const device = await prisma.mobileDevice.findFirst({ where: { deviceId } })
  if (!device) return { ok: false, reason: 'invalid' }

  const decision = decideRotation(presentedHash, device)

  if (decision === 'reuse-detected') {
    await prisma.mobileDevice.update({
      where: { id: device.id },
      data: { revokedAt: new Date(), refreshTokenHash: null, prevRefreshTokenHash: null }
    })
    await revokeUser(device.userId)
    return { ok: false, reason: 'reuse-detected' }
  }

  if (decision === 'reject') return { ok: false, reason: 'invalid' }

  const raw = generateRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
  await prisma.mobileDevice.update({
    where: { id: device.id },
    data: {
      refreshTokenHash: hashToken(raw),
      prevRefreshTokenHash: presentedHash,
      refreshExpiresAt: expiresAt,
      lastSeenAt: new Date()
    }
  })

  return { ok: true, refreshToken: raw, userId: device.userId, assignmentId: device.assignmentId }
}

/** Logout: kill the device session; access token dies at its 15-min expiry. */
export async function revokeDeviceSession(userId: string, deviceId: string): Promise<void> {
  await prisma.mobileDevice.updateMany({
    where: { userId, deviceId },
    data: { revokedAt: new Date(), refreshTokenHash: null, prevRefreshTokenHash: null, pushToken: null }
  })
}
