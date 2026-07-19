import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

const verifyOtpSchema = z.object({
  contact: z.string().min(1).max(200),
  code: z.string().min(1).max(10)
})

export async function POST(req: NextRequest) {
  try {
    const parsed = verifyOtpSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Contact and code are required' },
        { status: 400 }
      )
    }
    const { contact, code } = parsed.data

    // Dev bypass + env-gated QA test phones (web codes are 4-digit)
    const { isTestPhoneBypass } = await import('@/lib/auth/otp')
    const isDevBypass =
      (process.env.NODE_ENV === 'development' && code === '1234') ||
      isTestPhoneBypass(contact, code)

    if (isDevBypass) {
      return NextResponse.json({ success: true })
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        identifier: contact,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'EXPIRED_OTP', message: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempts limit
    const attempts = otpRecord.attempts + 1
    if (attempts > 5) {
      await prisma.otpCode.delete({
        where: { id: otpRecord.id }
      })
      return NextResponse.json(
        { success: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Update attempts
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts }
    })

    // Compare code
    const isValid = await bcrypt.compare(code, otpRecord.codeHash)
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'INCORRECT_OTP',
          message: `Incorrect OTP. ${5 - attempts} attempts remaining.`,
          attemptsLeft: 5 - attempts
        },
        { status: 400 }
      )
    }

    // Mark as consumed
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('OTP verify route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
