import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Rate limiting: 10 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitKey = `ratelimit:check-phone:${ip}`
    const requests = await redis.incr(limitKey)
    if (requests === 1) {
      await redis.set(limitKey, '1', 'EX', 60)
    }
    if (requests > 10) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again in 1 minute.' },
        { status: 429 }
      )
    }

    // Find active user
    const user = await prisma.user.findFirst({
      where: { phone, status: 'ACTIVE', deletedAt: null }
    })

    if (!user) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      hasPin: user.pinHash !== null,
      name: user.name,
      role: user.role
    })

  } catch (error: any) {
    console.error('Check phone API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
