import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import QRCode from 'qrcode'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import {
  generateTotpSecret,
  buildOtpAuthUri,
  getTwoFactorState
} from '@/lib/auth/twofactor'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { windowLimiter } from '@/lib/ratelimit'

/**
 * Begin enrolment. The chosen method decides what the client must confirm:
 *  - TOTP: returns a QR (data-URI) + manual secret. The secret is stashed in
 *    Redis (5 min), NOT persisted, until /confirm verifies a live code.
 *  - SMS: dispatches an MFA OTP to the user's phone; /confirm verifies it.
 */

const schema = z.object({ method: z.enum(['TOTP', 'SMS']) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'method required' }, { status: 400 })
  }
  const { method } = parsed.data

  const existing = await getTwoFactorState(userId)
  if (existing.enrolled) {
    return NextResponse.json(
      { success: false, error: 'ALREADY_ENROLLED', message: 'Disable current 2FA before re-enrolling.' },
      { status: 409 }
    )
  }

  if (method === 'TOTP') {
    const account = session.user.email || session.user.phone || userId

    // A second concurrent/accidental start call previously generated a new
    // secret and silently overwrote the pending one in Redis — invalidating
    // a QR the user may have already scanned, with no warning. Reuse the
    // existing pending TOTP secret instead of regenerating, so repeated
    // start calls are idempotent (same QR every time) until it's confirmed
    // or the 5-minute window lapses.
    const pendingRaw = await redis.get(`mfa_enroll:${userId}`)
    let secret: string
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw) as { method: string; secret?: string }
      secret = pending.method === 'TOTP' && pending.secret ? pending.secret : generateTotpSecret()
    } else {
      secret = generateTotpSecret()
    }
    const otpauthUri = buildOtpAuthUri(secret, account)
    const qrDataUri = await QRCode.toDataURL(otpauthUri)

    // Stash pending secret; confirm step reads it and persists encrypted.
    // Resets the 5-min TTL on every call, including reuse.
    await redis.set(`mfa_enroll:${userId}`, JSON.stringify({ method, secret }), 'EX', 300)

    return NextResponse.json({
      success: true,
      method,
      qrDataUri,
      secret, // manual-entry key
      account
    })
  }

  // SMS
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true }
  })
  if (!user?.phone) {
    return NextResponse.json(
      { success: false, error: 'NO_PHONE', message: 'Add a phone number before enabling SMS 2FA.' },
      { status: 400 }
    )
  }
  const smsLimit = await windowLimiter(`mfa-sms:${user.phone}`, 3, 300)
  if (!smsLimit.success) {
    return NextResponse.json(
      { success: false, error: 'TOO_MANY_SMS', message: 'Too many code requests. Try again in a few minutes.' },
      { status: 429 }
    )
  }
  await redis.set(`mfa_enroll:${userId}`, JSON.stringify({ method }), 'EX', 300)
  const code = await createOTP(user.phone, 'SMS', 'MFA')
  await sendOTP(user.phone, code, 'SMS', 'MFA')

  return NextResponse.json({
    success: true,
    method,
    maskedPhone: `••••••${user.phone.slice(-4)}`
  })
}
