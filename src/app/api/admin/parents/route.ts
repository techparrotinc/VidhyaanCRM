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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const d = new Date(endDate)
        d.setHours(23, 59, 59, 999)
        where.createdAt.lte = d
      }
    }

    const [total, parents] = await Promise.all([
      prisma.parent.count({ where }),
      prisma.parent.findMany({
        where,
        include: {
          _count: {
            select: {
              enquiries: true,
              bookmarks: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      data: parents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('List Admin Parents API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
