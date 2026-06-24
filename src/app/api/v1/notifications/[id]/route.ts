import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    let isOwner = false
    let recipientId = session.user.id

    if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id }
      })
      if (parent && notification.recipientType === 'PARENT' && notification.recipientId === parent.id) {
        isOwner = true
        recipientId = parent.id
      }
    } else {
      if (notification.recipientType === 'USER' && notification.recipientId === session.user.id) {
        isOwner = true
      }
    }

    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Soft delete
    await prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate Redis unread count cache
    const cacheKey = `unread_notification_count:${recipientId}`
    await redis.del(cacheKey)

    return NextResponse.json({ success: true, message: 'Notification deleted successfully' })
  } catch (error: any) {
    console.error('DELETE notification error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
