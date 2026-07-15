import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAndConsumeOtp } from '@/lib/auth/otp'
import { windowLimiter } from '@/lib/ratelimit'
import { completeLogin } from '@/lib/mobile-auth/service'
import { findUserByPhone } from '@/lib/mobile-auth/phone'

/**
 * Mobile login step 2: verify the OTP. Outcome is one of
 *  - tokens (single-workspace, no 2FA)
 *  - selectionRequired + selectionToken (multi-role user → /auth/select)
 *  - twoFactorRequired + challengeToken (→ /auth/2fa)
 */

const bodySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  code: z.string().min(4).max(8),
  deviceId: z.string().min(8).max(128),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(120).optional()
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }

  const limit = await windowLimiter(`mobile-verify:${body.phone.replace(/\D/g, '')}`, 10, 15 * 60)
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Try again later.' },
      { status: 429 }
    )
  }

  const user = await findUserByPhone(body.phone)
  if (!user || !user.phone) {
    return NextResponse.json(
      { success: false, code: 'NO_ACCOUNT', error: 'This number is not registered' },
      { status: 404 }
    )
  }

  // Env-gated test bypass: numbers listed in MOBILE_TEST_PHONES (comma-
  // separated) accept 123456. For QA against orgs like "test" where the
  // number has no real SIM. Empty/unset = no bypass, prod-safe default.
  const testPhones = (process.env.MOBILE_TEST_PHONES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const isTestBypass = testPhones.includes(user.phone) && body.code === '123456'

  // Verify against the canonical stored phone — same identifier OTP was sent with.
  const valid = isTestBypass || (await verifyAndConsumeOtp(user.phone, body.code))
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Incorrect or expired code' },
      { status: 401 }
    )
  }

  const outcome = await completeLogin(user.id, {
    deviceId: body.deviceId,
    platform: body.platform,
    deviceName: body.deviceName
  })
  return outcome.response
}
