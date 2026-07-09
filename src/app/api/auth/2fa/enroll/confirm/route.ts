import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { encryptSecret } from '@/lib/payments/vault'
import {
  verifyTotpCode,
  verifyMfaSms,
  generateBackupCodes,
  getTwoFactorState
} from '@/lib/auth/twofactor'
import { AuditAction } from '@prisma/client'

/**
 * Finalise enrolment: verify a live code against the pending method, then
 * persist. TOTP secret is stored encrypted; backup codes returned once
 * (hashes stored). This is the only place enrolment becomes active.
 */

const schema = z.object({ code: z.string().min(4).max(10) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'code required' }, { status: 400 })
  }
  const { code } = parsed.data

  if ((await getTwoFactorState(userId)).enrolled) {
    return NextResponse.json({ success: false, error: 'ALREADY_ENROLLED' }, { status: 409 })
  }

  const raw = await redis.get(`mfa_enroll:${userId}`)
  if (!raw) {
    return NextResponse.json(
      { success: false, error: 'ENROLMENT_EXPIRED', message: 'Enrolment timed out. Start again.' },
      { status: 410 }
    )
  }
  const pending = JSON.parse(raw) as { method: 'TOTP' | 'SMS'; secret?: string }

  let secretEnc: string | null = null
  if (pending.method === 'TOTP') {
    if (!pending.secret || !(await verifyTotpCode(code, pending.secret))) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE', message: 'Code did not match. Try the current code.' },
        { status: 400 }
      )
    }
    secretEnc = encryptSecret(pending.secret)
  } else {
    if (!(await verifyMfaSms(userId, code))) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE', message: 'Incorrect or expired code.' },
        { status: 400 }
      )
    }
  }

  const { plaintext, hashes } = await generateBackupCodes()

  await prisma.userTwoFactor.upsert({
    where: { userId },
    create: {
      userId,
      method: pending.method,
      secretEnc,
      enabledAt: new Date(),
      backupCodes: hashes
    },
    update: {
      method: pending.method,
      secretEnc,
      enabledAt: new Date(),
      backupCodes: hashes,
      lastUsedStep: null
    }
  })

  await redis.del(`mfa_enroll:${userId}`)

  // Best-effort audit trail.
  try {
    await prisma.auditLog.create({
      data: {
        orgId: session.user.orgId || null,
        userId,
        action: AuditAction.UPDATE,
        entityType: 'UserTwoFactor',
        entityId: userId,
        after: { event: '2fa_enabled', method: pending.method }
      }
    })
  } catch {
    // audit is non-blocking
  }

  return NextResponse.json({
    success: true,
    method: pending.method,
    backupCodes: plaintext // shown once
  })
}
