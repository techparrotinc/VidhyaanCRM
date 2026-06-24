import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, otpCode } = body

    if (!phone || !otpCode) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP code are required' },
        { status: 400 }
      )
    }

    // Dev bypass
    const isDevBypass = process.env.NODE_ENV === 'development' && otpCode === '123456'
    let otpRecord = null

    if (!isDevBypass) {
      otpRecord = await prisma.otpCode.findFirst({
        where: {
          identifier: phone,
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

      // Check attempts
      const attempts = otpRecord.attempts + 1
      if (attempts > 5) {
        await prisma.otpCode.delete({
          where: { id: otpRecord.id }
        })
        return NextResponse.json(
          { success: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Request a new OTP.' },
          { status: 400 }
        )
      }

      // Update attempts
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts }
      })

      // Compare hash
      const isValid = await bcrypt.compare(otpCode, otpRecord.codeHash)
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

      // Mark consumed
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() }
      })
    }

    // Verify user exists before issuing reset token
    const user = await prisma.user.findFirst({
      where: { phone, status: 'ACTIVE', deletedAt: null }
    })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: 'No user account found.' },
        { status: 400 }
      )
    }

    // Generate reset token valid for 10 minutes (600 seconds)
    const resetToken = crypto.randomUUID()
    await redis.set(`pin_reset_token:${phone}`, resetToken, 'EX', 600)

    return NextResponse.json({
      success: true,
      resetToken
    })

  } catch (error: any) {
    console.error('Generate reset token error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
