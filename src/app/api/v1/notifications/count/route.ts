import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

/**
 * Like the notifications list route, this predates the route() composer.
 * Mobile Bearer JWTs are verified in middleware.ts and rewritten to
 * x-user-id/x-user-role — read those first, else the NextAuth cookie.
 */
async function resolveUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  const headerId = req.headers.get('x-user-id')
  const headerRole = req.headers.get('x-user-role')
  if (headerId && headerRole) return { id: headerId, role: headerRole }
  const session = await auth()
  if (!session?.user?.id) return null
  return { id: session.user.id, role: session.user.role }
}

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    let recipientId = userId

    const where: any = {
      readAt: null,
      deletedAt: null
    }

    if (user.role === 'PARENT') {
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
