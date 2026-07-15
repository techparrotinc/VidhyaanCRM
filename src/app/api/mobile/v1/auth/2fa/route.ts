import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySecondFactor } from '@/lib/auth/twofactor'
import { windowLimiter } from '@/lib/ratelimit'
import { verifyIntermediateToken } from '@/lib/mobile-auth/jwt'
import { completeLogin } from '@/lib/mobile-auth/service'

/**
 * Mobile login step 3: second factor (TOTP or backup code). Same invariant
 * as web: full tokens are minted only after this verifies.
 */

const bodySchema = z.object({
  challengeToken: z.string().min(20),
  code: z.string().min(4).max(16),
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

  const claims = await verifyIntermediateToken(body.challengeToken, '2fa')
  if (!claims) {
    return NextResponse.json(
      { success: false, error: 'Session expired — sign in again' },
      { status: 401 }
    )
  }

  const limit = await windowLimiter(`mobile-2fa:${claims.userId}`, 8, 15 * 60)
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Try again later.' },
      { status: 429 }
    )
  }

  const ok = await verifySecondFactor(claims.userId, body.code)
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Incorrect code' }, { status: 401 })
  }

  const outcome = await completeLogin(
    claims.userId,
    { deviceId: claims.deviceId, platform: body.platform, deviceName: body.deviceName },
    claims.assignmentId,
    { skipTwoFactor: true }
  )
  return outcome.response
}
