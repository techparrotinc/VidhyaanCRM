import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { pin, confirmPin } = body

    if (!pin || !confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PIN and confirmation PIN are required' },
        { status: 400 }
      )
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PINs do not match' },
        { status: 400 }
      )
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    if (OBVIOUS_PATTERNS.includes(pin)) {
      return NextResponse.json(
        { success: false, error: 'Obvious PIN pattern. Choose a different one.' },
        { status: 400 }
      )
    }

    // Hash PIN using Argon2id
    const hash = await argon2.hash(pin, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 65536
      timeCost: 3,
      parallelism: 1
    })

    const userId = session.user.id

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        pinHash: hash,
        pinSetAt: new Date()
      }
    })

    // Clear lockout keys in Redis
    await redis.del(`pinlock:${userId}`)
    await redis.del(`pinlock:${userId}:attempts`)

    // Write audit log
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId,
        orgId: user.orgId,
        action: AuditAction.PIN_SET,
        entityType: 'USER',
        entityId: userId,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch((e) => console.error('Failed to create PIN_SET audit log:', e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Set PIN API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
