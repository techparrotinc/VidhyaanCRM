import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10') || 10))

    const where = {
      verificationStatus: 'PENDING' as const,
      deletedAt: null
    }

    const [total, schools] = await Promise.all([
      prisma.school.count({ where }),
      prisma.school.findMany({
        where,
        include: {
          organization: true,
          contacts: {
            where: { deletedAt: null }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Fetch school claim documents from audit logs
    const schoolIds = schools.map(s => s.id)
    const auditLogs = schoolIds.length > 0
      ? await prisma.auditLog.findMany({
          where: {
            entityType: 'SCHOOL_CLAIM',
            entityId: { in: schoolIds }
          }
        })
      : []

    const schoolsWithDocs = schools.map(school => {
      const claimLogs = auditLogs.filter(log => log.entityId === school.id)
      const documents = claimLogs
        .map(log => {
          const after = log.after as any
          return after?.documentUrl ? { documentUrl: after.documentUrl, createdAt: log.createdAt } : null
        })
        .filter(Boolean)

      return {
        ...school,
        documents
      }
    })

    return NextResponse.json({
      data: schoolsWithDocs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Pending Schools API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
