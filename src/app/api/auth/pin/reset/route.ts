import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import argon2 from 'argon2'
import { AuditAction } from '@prisma/client'

const OBVIOUS_PATTERNS = [
  '1111', '2222', '3333', '4444', '5555',
  '6666', '7777', '8888', '9999', '0000',
  '1234', '4321', '0123', '9876'
]

export async function POST(req: NextRequest) {
  try {
    const parsed = z.object({
      phone: z.string().min(1).max(20),
      otpToken: z.string().min(1).max(100),
      newPin: z.string().min(1).max(10),
      confirmPin: z.string().min(1).max(10)
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'All fields (phone, otpToken, newPin, confirmPin) are required' },
        { status: 400 }
      )
    }
    const { phone, otpToken, newPin, confirmPin } = parsed.data

    // 1. Validate OTP token from Redis
    const tokenKey = `pin_reset_token:${phone}`
    const savedToken = await redis.get(tokenKey)
    if (!savedToken || savedToken !== otpToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP reset token' },
        { status: 401 }
      )
    }

    // 2. Find user by phone
    const user = await prisma.user.findFirst({
      where: { phone, status: 'ACTIVE' }
    })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // 3. Same PIN validations
    if (newPin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PINs do not match' },
        { status: 400 }
      )
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    if (OBVIOUS_PATTERNS.includes(newPin)) {
      return NextResponse.json(
        { success: false, error: 'Obvious PIN pattern. Choose a different one.' },
        { status: 400 }
      )
    }

    // 4. Hash and save new PIN
    const hash = await argon2.hash(newPin, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    })

    const userId = user.id

    // Update user in DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        pinHash: hash,
        pinSetAt: new Date()
      }
    })

    // 5. Delete reset token from Redis
    await redis.del(tokenKey)

    // 6. Clear lockout
    await redis.del(`pinlock:${userId}`)
    await redis.del(`pinlock:${userId}:attempts`)

    // 7. Write audit log
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId,
        orgId: user.orgId,
        action: AuditAction.PIN_RESET,
        entityType: 'USER',
        entityId: userId,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch((e) => console.error('Failed to create PIN_RESET audit log:', e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reset PIN API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
