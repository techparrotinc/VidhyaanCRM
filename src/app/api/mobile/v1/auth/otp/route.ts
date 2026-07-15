import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { otpSendLimiter } from '@/lib/ratelimit'
import { findUserByPhone } from '@/lib/mobile-auth/phone'

/**
 * Mobile login step 1: send an OTP to a phone that already belongs to a
 * Vidhyaan account. No self-serve signup here — unknown numbers get a
 * NO_ACCOUNT so the app can show the "ask your school / admin" screen.
 */

const bodySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number')
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { success: false, error: 'Enter a valid phone number' },
      { status: 422 }
    )
  }

  const limit = await otpSendLimiter(`mobile-otp:${body.phone.replace(/\D/g, '')}`)
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests. Try again later.' },
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

  // OTP identifier = the user's canonical stored phone (send/verify agree).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const code = await createOTP(user.phone, 'SMS', 'LOGIN', ip)
  await sendOTP(user.phone, code, 'SMS', 'LOGIN', { orgId: user.orgId })

  return NextResponse.json({ success: true })
}
