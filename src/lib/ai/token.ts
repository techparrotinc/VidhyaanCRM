// AI Gateway token mint — RS256 JWTs the gateway verifies via our JWKS.
// Private key lives ONLY here (env). The gateway holds no signing material.
//
// Env:
//   AI_JWT_PRIVATE_KEY  base64-encoded PKCS8 PEM (RSA 2048)
//   AI_JWT_KID          key id published in JWKS, e.g. "ai-2026-07"
// Generate a keypair with: scripts/generate-ai-jwt-key.sh

import { SignJWT, importPKCS8, exportJWK } from 'jose'
import { createPublicKey } from 'crypto'

const ISSUER = 'vidhyaan'
const AUDIENCE = 'ai-gateway'
const TTL_SECONDS = 300 // 5 min — widget silently re-mints

export type AiTokenInput = {
  userId: string
  orgId: string
  role: string
  planId: string | null
  entitlements: string[]
  dailyLimit: number
  hasCredits: boolean
  academicYearId: string | null
}

function privateKeyPem(): string {
  const b64 = process.env.AI_JWT_PRIVATE_KEY
  if (!b64) throw new Error('AI_JWT_PRIVATE_KEY not configured')
  return Buffer.from(b64, 'base64').toString('utf8')
}

function kid(): string {
  const v = process.env.AI_JWT_KID
  if (!v) throw new Error('AI_JWT_KID not configured')
  return v
}

export async function mintAiToken(input: AiTokenInput): Promise<{ token: string; expiresIn: number }> {
  const key = await importPKCS8(privateKeyPem(), 'RS256')
  const token = await new SignJWT({
    orgId: input.orgId,
    role: input.role,
    plan: input.planId ?? 'none',
    entitlements: input.entitlements,
    dailyLimit: input.dailyLimit,
    hasCredits: input.hasCredits,
    academicYearId: input.academicYearId ?? undefined
  })
    .setProtectedHeader({ alg: 'RS256', kid: kid() })
    .setSubject(input.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(key)

  return { token, expiresIn: TTL_SECONDS }
}

/** Public JWKS document — derived from the private key, safe to expose. */
export async function jwks(): Promise<{ keys: object[] }> {
  const pub = createPublicKey(privateKeyPem())
  const jwk = await exportJWK(pub)
  return { keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: kid() }] }
}
