import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Fetch notifications
    let notifications = await prisma.notification.findMany({
      where: {
        recipientType: 'PARENT',
        recipientId: parent.id
      },
      orderBy: { createdAt: 'desc' }
    })

    // Seeding mock notifications in development if none exist
    if (notifications.length === 0) {
      const firstOrg = await prisma.organization.findFirst()
      if (firstOrg) {
        await prisma.notification.createMany({
          data: [
            {
              orgId: firstOrg.id,
              recipientType: 'PARENT',
              recipientId: parent.id,
              title: 'Enquiry Responded',
              body: 'Prince Matriculation School has replied to your enquiry for Class 1. Click to view details.',
              channel: 'IN_APP',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
              orgId: firstOrg.id,
              recipientType: 'PARENT',
              recipientId: parent.id,
              title: 'Admission Visit Scheduled',
              body: 'A campus visit has been scheduled at Prince Matriculation School for July 2, 2026 at 10:00 AM.',
              channel: 'IN_APP',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
              orgId: firstOrg.id,
              recipientType: 'PARENT',
              recipientId: parent.id,
              title: 'Welcome to Vidhyaan!',
              body: 'Thank you for registering. Start exploring schools and learning centers near you.',
              channel: 'IN_APP',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            }
          ]
        })

        // Refetch
        notifications = await prisma.notification.findMany({
          where: {
            recipientType: 'PARENT',
            recipientId: parent.id
          },
          orderBy: { createdAt: 'desc' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: notifications
    })

  } catch (error: any) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { id, markAllRead } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          recipientType: 'PARENT',
          recipientId: parent.id,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })
    } else if (id) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id }
      })

      if (!notification || notification.recipientId !== parent.id) {
        return NextResponse.json(
          { success: false, error: 'Notification not found or access denied' },
          { status: 404 }
        )
      }

      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Either id or markAllRead must be provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    })

  } catch (error: any) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
