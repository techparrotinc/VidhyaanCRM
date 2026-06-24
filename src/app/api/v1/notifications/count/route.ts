import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    let recipientId = userId

    const where: any = {
      readAt: null,
      deletedAt: null
    }

    if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId }
      })
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent record not found' }, { status: 404 })
      }
      where.recipientType = 'PARENT'
      where.recipientId = parent.id
      recipientId = parent.id
    } else {
      where.recipientType = 'USER'
      where.recipientId = userId
    }

    const cacheKey = `unread_notification_count:${recipientId}`

    // Try reading cache
    const cachedCount = await redis.get(cacheKey)
    if (cachedCount !== null && cachedCount !== undefined) {
      return NextResponse.json({ success: true, unreadCount: parseInt(cachedCount) })
    }

    const unreadCount = await prisma.notification.count({ where })

    // Cache count in Redis for 30 seconds
    await redis.set(cacheKey, unreadCount.toString(), 'EX', 30)

    return NextResponse.json({ success: true, unreadCount })
  } catch (error: any) {
    console.error('GET notifications count error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
