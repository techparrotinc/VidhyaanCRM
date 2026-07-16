import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { verifyIntermediateToken } from '@/lib/mobile-auth/jwt'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { otpSendLimiter } from '@/lib/ratelimit'

/**
 * "Use SMS code instead" on the mobile 2FA screen — dispatches an MFA OTP
 * to the account phone for a live challenge. verifySecondFactor already
 * accepts a live MFA SMS code as the second factor, so the normal /auth/2fa
 * verify call works unchanged afterwards.
 */

const bodySchema = z.object({ challengeToken: z.string().min(20) })

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }

  const claims = await verifyIntermediateToken(body.challengeToken, '2fa')
  if (!claims) {
    return NextResponse.json({ success: false, error: 'Challenge expired — sign in again' }, { status: 401 })
  }

  const limit = await otpSendLimiter(`mobile-2fa-sms:${claims.userId}`)
  if (!limit.success) {
    return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const user = await prisma.user.findUnique({ where: { id: claims.userId }, select: { phone: true } })
  if (!user?.phone) {
    return NextResponse.json({ success: false, error: 'No phone on this account' }, { status: 400 })
  }

  const code = await createOTP(user.phone, 'SMS', 'MFA')
  await sendOTP(user.phone, code, 'SMS', 'MFA')

  return NextResponse.json({
    success: true,
    maskedPhone: `••••••${user.phone.slice(-4)}`
  })
}
