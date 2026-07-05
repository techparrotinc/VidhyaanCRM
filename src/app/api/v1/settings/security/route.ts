import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
import { AuditAction } from '@prisma/client'

const securityActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set'), pin: z.string().max(10), confirmPin: z.string().max(10) }),
  z.object({ action: z.literal('change'), currentPin: z.string().max(10), newPin: z.string().max(10), confirmPin: z.string().max(10) }),
  z.object({ action: z.literal('remove'), otpCode: z.string().max(10) })
])

const OBVIOUS_PATTERNS = [
  '1111', '2222', '3333', '4444', '5555',
  '6666', '7777', '8888', '9999', '0000',
  '1234', '4321', '0123', '9876'
]

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasPin: user.pinHash !== null,
      pinSetAt: user.pinSetAt,
      phone: user.phone
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const parsedBody = securityActionSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const body = parsedBody.data
    const { action } = body

    if (action === 'set') {
      const { pin, confirmPin } = body
      if (!pin || !confirmPin) {
        return NextResponse.json({ error: 'PIN and confirm PIN are required' }, { status: 400 })
      }
      if (pin !== confirmPin) {
        return NextResponse.json({ error: 'PINs do not match' }, { status: 400 })
      }
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 })
      }
      if (OBVIOUS_PATTERNS.includes(pin)) {
        return NextResponse.json({ error: 'Obvious PIN pattern. Choose another.' }, { status: 400 })
      }

      const hash = await argon2.hash(pin, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { pinHash: hash, pinSetAt: new Date() }
      })

      await redis.del(`pinlock:${user.id}`)
      await redis.del(`pinlock:${user.id}:attempts`)

      return NextResponse.json({ success: true })
    }

    if (action === 'change') {
      const { currentPin, newPin, confirmPin } = body
      if (!currentPin || !newPin || !confirmPin) {
        return NextResponse.json({ error: 'All PIN fields are required' }, { status: 400 })
      }

      if (!user.pinHash) {
        return NextResponse.json({ error: 'No PIN is currently set.' }, { status: 400 })
      }

      // Verify current pin
      const valid = await argon2.verify(user.pinHash, currentPin)
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect current PIN' }, { status: 400 })
      }

      if (newPin !== confirmPin) {
        return NextResponse.json({ error: 'New PINs do not match' }, { status: 400 })
      }
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ error: 'New PIN must be exactly 4 digits' }, { status: 400 })
      }
      if (OBVIOUS_PATTERNS.includes(newPin)) {
        return NextResponse.json({ error: 'Obvious PIN pattern. Choose another.' }, { status: 400 })
      }

      const hash = await argon2.hash(newPin, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { pinHash: hash, pinSetAt: new Date() }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      const { otpCode } = body
      if (!otpCode) {
        return NextResponse.json({ error: 'OTP code is required' }, { status: 400 })
      }

      if (!user.phone) {
        return NextResponse.json({ error: 'User does not have a phone number.' }, { status: 400 })
      }

      const isDevBypass = process.env.NODE_ENV === 'development' && otpCode === '123456'
      let otpRecord = null

      if (!isDevBypass) {
        otpRecord = await prisma.otpCode.findFirst({
          where: {
            identifier: user.phone,
            consumedAt: null,
            expiresAt: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        })

        if (!otpRecord) {
          return NextResponse.json({ error: 'OTP expired or invalid' }, { status: 400 })
        }

        const isValid = await bcrypt.compare(otpCode, otpRecord.codeHash)
        if (!isValid) {
          return NextResponse.json({ error: 'Incorrect OTP code' }, { status: 400 })
        }

        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { consumedAt: new Date() }
        })
      }

      // Remove PIN
      await prisma.user.update({
        where: { id: user.id },
        data: { pinHash: null, pinSetAt: null }
      })

      await redis.del(`pinlock:${user.id}`)
      await redis.del(`pinlock:${user.id}:attempts`)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Settings security API error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
