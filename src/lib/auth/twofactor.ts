import { generateSecret, generateURI, verify as otpVerify } from 'otplib'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/db/client'
import { encryptSecret, decryptSecret } from '@/lib/payments/vault'
import type { TwoFactorMethod } from '@prisma/client'

/**
 * Second-factor engine. TOTP (RFC 6238) is the primary method; SMS is an
 * opt-in fallback that rides the existing OtpCode table (purpose = MFA).
 *
 * Invariants:
 *  - TOTP secret is only ever persisted encrypted (payment vault, AES-256-GCM).
 *  - A session is issued ONLY after the second factor verifies — the login
 *    flow never mints a half-authed JWT (see challenge-token flow in the API).
 *  - TOTP anti-replay: a verified step is recorded; a step <= the last used
 *    step is rejected so a leaked code cannot be replayed inside its window.
 */

// Allow ±1 time-step (±30s) clock skew, standard tolerance.
const EPOCH_TOLERANCE = 30
const APP_LABEL = 'Vidhyaan'
const BACKUP_CODE_COUNT = 10

export interface TwoFactorState {
  enrolled: boolean
  method: TwoFactorMethod | null
  backupCodesRemaining: number
}

/** Generate a fresh base32 TOTP secret (not yet persisted). */
export function generateTotpSecret(): string {
  return generateSecret()
}

/** otpauth:// URI for QR encoding. `account` is the user's email/phone. */
export function buildOtpAuthUri(secret: string, account: string): string {
  return generateURI({ secret, label: account, issuer: APP_LABEL })
}

/**
 * Verify a TOTP code against a plaintext secret, tolerating ±1 time-step of
 * clock skew. Returns validity plus the actually-consumed step index (for
 * anti-replay bookkeeping). Does NOT persist replay state.
 */
export async function verifyTotpDetailed(
  code: string,
  secret: string,
  afterStep?: number | null
): Promise<{ valid: boolean; step?: number }> {
  const clean = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return { valid: false }
  try {
    const res = await otpVerify({
      token: clean,
      secret,
      epochTolerance: EPOCH_TOLERANCE,
      // Library-level anti-replay: rejects any timeStep <= afterStep.
      ...(afterStep != null ? { afterTimeStep: afterStep } : {})
    })
    if (!res.valid) return { valid: false }
    const step = 'timeStep' in res ? res.timeStep : undefined
    return { valid: true, step }
  } catch {
    return { valid: false }
  }
}

/** Boolean-only TOTP check (enrolment confirm, disable). */
export async function verifyTotpCode(code: string, secret: string): Promise<boolean> {
  return (await verifyTotpDetailed(code, secret)).valid
}

/** Generate N backup codes (plaintext, for one-time display) + their hashes. */
export async function generateBackupCodes(): Promise<{
  plaintext: string[]
  hashes: string[]
}> {
  const plaintext: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 10 chars, unambiguous alphabet, formatted xxxxx-xxxxx
    const raw = crypto.randomBytes(8).toString('hex').slice(0, 10).toUpperCase()
    plaintext.push(`${raw.slice(0, 5)}-${raw.slice(5)}`)
  }
  const hashes = await Promise.all(plaintext.map((c) => bcrypt.hash(c, 10)))
  return { plaintext, hashes }
}

/** Read enrolment state for UI / policy checks. */
export async function getTwoFactorState(userId: string): Promise<TwoFactorState> {
  const row = await prisma.userTwoFactor.findUnique({ where: { userId } })
  if (!row || !row.enabledAt) {
    return { enrolled: false, method: null, backupCodesRemaining: 0 }
  }
  const codes = Array.isArray(row.backupCodes) ? row.backupCodes : []
  return {
    enrolled: true,
    method: row.method,
    backupCodesRemaining: codes.length
  }
}

export async function isEnrolled(userId: string): Promise<boolean> {
  return (await getTwoFactorState(userId)).enrolled
}

/**
 * Verify a submitted second factor for a user during login.
 * Accepts a TOTP code, or a backup code (single-use), or an SMS OTP already
 * validated upstream (pass `smsVerified: true`). Enforces TOTP anti-replay.
 * Returns true on success and mutates replay/backup state.
 */
export async function verifySecondFactor(
  userId: string,
  code: string,
  opts: { smsVerified?: boolean } = {}
): Promise<boolean> {
  const row = await prisma.userTwoFactor.findUnique({ where: { userId } })
  if (!row || !row.enabledAt) return false

  if (opts.smsVerified) return true

  // Try TOTP first if a secret is enrolled.
  if (row.secretEnc) {
    let secret: string
    try {
      secret = decryptSecret(row.secretEnc)
    } catch {
      secret = ''
    }
    if (secret) {
      // afterStep pushes replay rejection into the verifier: a code from an
      // already-consumed (or earlier) window fails outright.
      const totp = await verifyTotpDetailed(code, secret, row.lastUsedStep)
      if (totp.valid) {
        if (totp.step != null) {
          await prisma.userTwoFactor.update({
            where: { userId },
            data: { lastUsedStep: totp.step }
          })
        }
        return true
      }
    }
  }

  // SMS fallback: a live MFA OTP for the user's phone.
  if (await verifyMfaSms(userId, code)) return true

  // Fall back to a backup code (single-use).
  const hashes: string[] = Array.isArray(row.backupCodes)
    ? (row.backupCodes as string[])
    : []
  const clean = code.replace(/\s+/g, '').toUpperCase()
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(clean, hashes[i])) {
      const remaining = hashes.filter((_, idx) => idx !== i)
      await prisma.userTwoFactor.update({
        where: { userId },
        data: { backupCodes: remaining }
      })
      return true
    }
  }

  return false
}

/**
 * Verify (and consume) a live SMS/WhatsApp MFA OTP for a user's phone.
 * Mirrors the OTP-login attempt/consume semantics in the auth config.
 */
export async function verifyMfaSms(userId: string, code: string): Promise<boolean> {
  const clean = code.replace(/\s+/g, '')
  if (!/^\d{4,6}$/.test(clean)) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true }
  })
  if (!user?.phone) return false

  const otp = await prisma.otpCode.findFirst({
    where: {
      identifier: user.phone,
      purpose: 'MFA',
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })
  if (!otp) return false

  if (otp.attempts >= 5) {
    await prisma.otpCode.delete({ where: { id: otp.id } })
    return false
  }
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } }
  })

  const ok = await bcrypt.compare(clean, otp.codeHash)
  if (!ok) return false

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  })
  return true
}

/**
 * Whether a user must complete a second factor to finish login.
 * True if the user is personally enrolled OR their org policy requires it.
 */
export async function requiresSecondFactor(
  userId: string,
  orgId: string | null,
  role: string
): Promise<boolean> {
  if (await isEnrolled(userId)) return true
  return orgPolicyRequires(orgId, role)
}

/**
 * Org-level policy: `settings.require2fa` enables enforcement; optional
 * `settings.require2faRoles` narrows it to specific roles (default: all staff).
 */
export async function orgPolicyRequires(
  orgId: string | null,
  role: string
): Promise<boolean> {
  if (!orgId) return false
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true }
  })
  const settings = (org?.settings ?? {}) as Record<string, unknown>
  if (settings.require2fa !== true) return false
  const roles = settings.require2faRoles
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.includes(role)
  }
  return true
}
