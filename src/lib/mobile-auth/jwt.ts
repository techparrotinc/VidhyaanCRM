import { SignJWT, jwtVerify } from 'jose'

/**
 * Mobile access tokens (JWT, HS256). Edge-safe — imported by middleware.ts,
 * so this module must never pull in prisma or any Node-only dependency.
 *
 * The token carries the same identity the middleware would otherwise derive
 * from a NextAuth session; middleware verifies it and re-sets the identity
 * headers, after which route() applies RBAC/revocation/module checks
 * unchanged. Short-lived by design — revocation still lives in Redis and is
 * checked on every request by the composer.
 */

const ISSUER = 'vidhyaan-mobile'
const AUDIENCE = 'vidhyaan-api'
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60

export interface MobileAccessClaims {
  userId: string
  role: string
  orgId: string | null
  name: string
  assignmentId: string
  deviceId: string
}

function secretKey(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('MOBILE_JWT_SECRET missing or shorter than 32 chars')
  }
  return new TextEncoder().encode(secret)
}

export async function signMobileAccessToken(
  claims: MobileAccessClaims,
  ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS
): Promise<string> {
  return new SignJWT({
    role: claims.role,
    orgId: claims.orgId,
    name: claims.name,
    assignmentId: claims.assignmentId,
    deviceId: claims.deviceId,
    typ: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secretKey())
}

export async function verifyMobileAccessToken(
  token: string
): Promise<MobileAccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE
    })
    if (payload.typ !== 'access' || !payload.sub) return null
    return {
      userId: payload.sub,
      role: String(payload.role ?? ''),
      orgId: payload.orgId == null ? null : String(payload.orgId),
      name: String(payload.name ?? ''),
      assignmentId: String(payload.assignmentId ?? ''),
      deviceId: String(payload.deviceId ?? '')
    }
  } catch {
    return null
  }
}

/**
 * Short-lived intermediate tokens for the two half-authed login states:
 * workspace selection (multi-role users) and the 2FA challenge. Neither
 * grants API access — verifyMobileAccessToken rejects them via `typ`.
 */
export type IntermediatePurpose = 'select' | '2fa'

export async function signIntermediateToken(
  purpose: IntermediatePurpose,
  payload: { userId: string; deviceId: string; assignmentId?: string }
): Promise<string> {
  return new SignJWT({
    typ: purpose,
    deviceId: payload.deviceId,
    assignmentId: payload.assignmentId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 5 * 60)
    .sign(secretKey())
}

export async function verifyIntermediateToken(
  token: string,
  purpose: IntermediatePurpose
): Promise<{ userId: string; deviceId: string; assignmentId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE
    })
    if (payload.typ !== purpose || !payload.sub) return null
    return {
      userId: payload.sub,
      deviceId: String(payload.deviceId ?? ''),
      assignmentId: payload.assignmentId ? String(payload.assignmentId) : undefined
    }
  } catch {
    return null
  }
}
