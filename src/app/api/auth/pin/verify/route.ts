import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import argon2 from 'argon2'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, pin, token } = body

    if (token) {
      const tokenKey = `pin_auth_token:${token}`
      const userId = await redis.get(tokenKey)
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'INVALID_TOKEN', message: 'Session expired. Try again.' },
          { status: 401 }
        )
      }
      await redis.del(tokenKey)
      return NextResponse.json({
        success: true,
        userId
      })
    }

    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Phone number and PIN are required' },
        { status: 400 }
      )
    }

    // 1. Find user by phone
    const user = await prisma.user.findFirst({
      where: { phone, status: 'ACTIVE' }
    })

    if (!user) {
      // Do not reveal if account exists
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Incorrect PIN' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Check lockout in Redis
    const isLocked = await redis.get(`pinlock:${userId}`)
    if (isLocked) {
      const ttl = await redis.ttl(`pinlock:${userId}`)
      return NextResponse.json(
        {
          success: false,
          error: 'PIN_LOCKED',
          message: 'Too many attempts. Try again in 15 minutes.',
          retryAfter: ttl > 0 ? ttl : 900
        },
        { status: 429 }
      )
    }

    // 3. Check pinHash exists
    if (!user.pinHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'PIN_NOT_SET',
          message: 'Please login with OTP'
        },
        { status: 400 }
      )
    }

    // 4. Verify PIN using Argon2
    const isValid = await argon2.verify(user.pinHash, pin)

    // 5. If invalid
    if (!isValid) {
      const attemptsKey = `pinlock:${userId}:attempts`
      const attempts = await redis.incr(attemptsKey)
      if (attempts === 1) {
        await redis.set(attemptsKey, '1', 'EX', 900)
      }

      if (attempts >= 5) {
        // Set lockout for 15 minutes (900 seconds)
        await redis.set(`pinlock:${userId}`, '1', 'EX', 900)
        await redis.del(attemptsKey)

        return NextResponse.json(
          {
            success: false,
            error: 'PIN_LOCKED',
            message: 'Too many attempts. Try again in 15 minutes.',
            retryAfter: 900
          },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_PIN',
            message: 'Incorrect PIN',
            attemptsLeft: 5 - attempts
          },
          { status: 401 }
        )
      }
    }

    // 6. If valid
    await redis.del(`pinlock:${userId}:attempts`)

    // Create a temporary authentication token valid for 60 seconds
    const tempToken = crypto.randomUUID()
    await redis.set(`pin_auth_token:${tempToken}`, userId, 'EX', 60)

    return NextResponse.json({
      success: true,
      userId,
      token: tempToken
    })

  } catch (error: any) {
    console.error('Verify PIN API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
