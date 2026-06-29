import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))

    const where: any = {}

    if (orgId) {
      where.orgId = orgId
    }
    if (userId) {
      where.userId = userId
    }
    if (action) {
      where.action = action as AuditAction
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          organization: {
            select: {
              name: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Soft-reference user resolution
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean))) as string[]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true }
        })
      : []

    const formattedLogs = logs.map((log) => {
      const user = users.find(u => u.id === log.userId)
      return {
        id: log.id,
        orgId: log.orgId,
        orgName: log.organization?.name || null,
        userId: log.userId,
        userName: user?.name || null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        metadata: {
          before: log.before,
          after: log.after
        }
      }
    })

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Audit Logs API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
