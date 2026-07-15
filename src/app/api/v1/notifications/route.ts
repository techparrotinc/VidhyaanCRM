import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

/**
 * This route predates the route() composer and calls auth() directly, so it
 * doesn't get the composer's header-based identity for free. The mobile
 * Bearer JWT is verified in middleware.ts and rewritten to x-user-id/
 * x-user-role there (same trust model as every /api/v1 route) — read those
 * first, falling back to the NextAuth cookie session for web.
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10') || 10))
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const skip = (page - 1) * limit

    const where: any = {
      deletedAt: null
    }

    if (user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id }
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent record not found' },
          { status: 404 }
        )
      }
      where.recipientType = 'PARENT'
      where.recipientId = parent.id
    } else {
      where.recipientType = 'USER'
      where.recipientId = user.id
    }

    if (unreadOnly) {
      where.readAt = null
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          readAt: null
        }
      })
    ])

    // Load linked entities for each notification if present
    const notificationsWithEntities = await Promise.all(
      notifications.map(async (n: any) => {
        const item = { ...n }
        const dataObj = n.data && typeof n.data === 'object' ? (n.data as any) : {}

        if (dataObj.leadId) {
          try {
            item.lead = await prisma.lead.findUnique({
              where: { id: dataObj.leadId },
              select: { id: true, parentName: true, kidName: true, gradeSought: true, status: true }
            })
          } catch (e) {
            console.error('Error fetching linked lead:', e)
          }
        }

        if (dataObj.admissionId) {
          try {
            item.admission = await prisma.admission.findUnique({
              where: { id: dataObj.admissionId },
              select: { 
                id: true, 
                applicantName: true, 
                gradeSought: true,
                status: true,
                stage: { select: { id: true, name: true } }
              }
            })
          } catch (e) {
            console.error('Error fetching linked admission:', e)
          }
        }

        if (dataObj.invoiceId) {
          try {
            item.invoice = await prisma.invoice.findUnique({
              where: { id: dataObj.invoiceId },
              select: { id: true, invoiceNumber: true, totalAmount: true, status: true, dueDate: true }
            })
          } catch (e) {
            console.error('Error fetching linked invoice:', e)
          }
        }

        return item
      })
    )

    return NextResponse.json({
      success: true,
      data: notificationsWithEntities,
      pagination: {
        page,
        limit,
        totalCount,
        unreadCount
      }
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
    const user = await resolveUser(req)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const parsed = z.object({
      ids: z.array(z.string().max(50)).max(500).optional(),
      all: z.boolean().optional()
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { ids, all } = parsed.data

    const where: any = {
      deletedAt: null
    }

    let recipientId = user.id

    if (user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id }
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent record not found' },
          { status: 404 }
        )
      }
      where.recipientType = 'PARENT'
      where.recipientId = parent.id
      recipientId = parent.id
    } else {
      where.recipientType = 'USER'
      where.recipientId = user.id
    }

    if (all) {
      await prisma.notification.updateMany({
        where: {
          ...where,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          ...where,
          id: { in: ids }
        },
        data: {
          readAt: new Date()
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Either ids array or all: true must be provided' },
        { status: 400 }
      )
    }

    // Invalidate Redis unread count cache
    const cacheKey = `unread_notification_count:${recipientId}`
    await redis.del(cacheKey)

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
