import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { OtpChannel, OtpPurpose } from '@prisma/client'

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

    // Detect channel
    const isPhone = /^[6-9]\d{9}$/.test(contact)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)

    if (!isPhone && !isEmail) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone or email' },
        { status: 400 }
      )
    }

    const channel: OtpChannel = isPhone ? 'SMS' : 'EMAIL'
    
    // Map API purpose to database OtpPurpose enum
    let mappedPurpose: OtpPurpose = OtpPurpose.LOGIN
    if (purpose === 'SIGNUP') {
      mappedPurpose = OtpPurpose.SIGNUP
    } else if (purpose === 'RECOVERY') {
      // Recovery behaves as LOGIN since RECOVERY is not in Prisma enum
      mappedPurpose = OtpPurpose.LOGIN
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

    const code = await createOTP(
      contact,
      channel,
      mappedPurpose,
      ipAddress
    )

    await sendOTP(contact, code, channel)

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
