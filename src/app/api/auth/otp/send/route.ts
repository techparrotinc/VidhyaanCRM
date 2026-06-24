import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { OtpChannel, OtpPurpose } from '@prisma/client'
import { otpSendLimiter } from '@/lib/ratelimit'
import { sendTemplateEmail, otpEmailTemplate } from '@/lib/integrations/resend'

const schema = z.object({
  contact: z.string().min(1),
  purpose: z.enum([
    'LOGIN', 'SIGNUP', 'RECOVERY'
  ]).default('LOGIN')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contact, purpose } = schema.parse(body)

    // Detect and validate channel
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    const isPhone = /^[6-9]\d{9}$/.test(contact)

    if (!isPhone && !isEmail) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CONTACT', message: 'Invalid contact format. Phone must be 10-digit Indian number starting with 6-9.' },
        { status: 400 }
      )
    }

    // Rate Limiting
    const rateLimit = await otpSendLimiter(`otp_send_${contact}`)
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many OTP requests. Please wait 15 minutes.',
          retryAfter: rateLimit.reset
        },
        { status: 429 }
      )
    }

    const channel: OtpChannel = isPhone ? 'SMS' : 'EMAIL'
    
    // Map API purpose to database OtpPurpose enum
    let mappedPurpose: OtpPurpose = OtpPurpose.LOGIN
    if (purpose === 'SIGNUP') {
      mappedPurpose = OtpPurpose.SIGNUP
    } else if (purpose === 'RECOVERY') {
      mappedPurpose = OtpPurpose.LOGIN
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

    const code = await createOTP(
      contact,
      channel,
      mappedPurpose,
      ipAddress
    )

    if (channel === 'EMAIL') {
      await sendTemplateEmail(
        contact,
        "Your Vidhyaan OTP",
        otpEmailTemplate({
          otp: code,
          expiryMinutes: 10,
          purpose
        })
      )
    } else {
      await sendOTP(contact, code, channel)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: Number(process.env.OTP_TTL_SECONDS || 600),
      channel
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('OTP send error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
