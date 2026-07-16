import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPinCredentials } from '@/lib/auth/verifyPin'
import { windowLimiter } from '@/lib/ratelimit'
import { completeLogin } from '@/lib/mobile-auth/service'
import { findUserByPhone } from '@/lib/mobile-auth/phone'

/**
 * Mobile PIN login — alternative to OTP for users who set a PIN on the web
 * (Settings → Security) . Reuses the web verifyPinCredentials gate (argon2 +
 * Redis lockout: 5 attempts / 15 min), then the shared completeLogin tail —
 * so 2FA and multi-workspace selection behave exactly like the OTP path.
 * Forgot PIN = just fall back to the normal /auth/otp + /auth/verify flow.
 */

const bodySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  pin: z.string().regex(/^\d{4}$/),
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

  const limit = await windowLimiter(`mobile-pin:${body.phone.replace(/\D/g, '')}`, 10, 15 * 60)
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Try again later.' },
      { status: 429 }
    )
  }

  // Resolve the canonical stored phone first — verifyPinCredentials matches
  // on the exact stored value, while the app sends +91XXXXXXXXXX.
  const user = await findUserByPhone(body.phone)
  if (!user || !user.phone) {
    return NextResponse.json(
      { success: false, code: 'NO_ACCOUNT', error: 'This number is not registered' },
      { status: 404 }
    )
  }

  const result = await verifyPinCredentials(user.phone, body.pin)
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        code: result.error,
        error: result.message,
        ...(result.attemptsLeft !== undefined ? { attemptsLeft: result.attemptsLeft } : {}),
        ...(result.retryAfter !== undefined ? { retryAfter: result.retryAfter } : {})
      },
      { status: result.status }
    )
  }

  const outcome = await completeLogin(result.userId, {
    deviceId: body.deviceId,
    platform: body.platform,
    deviceName: body.deviceName
  })
  return outcome.response
}
