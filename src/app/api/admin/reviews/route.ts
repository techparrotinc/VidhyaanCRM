// Platform-admin review moderation queue. Vidhyaan decides on flagged
// reviews (PRD: schools flag, Vidhyaan removes).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ReviewStatus } from '@prisma/client'
import { resolveAdminUser } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = await resolveAdminUser(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))

    const where = {
      deletedAt: null,
      ...(statusParam && ['PUBLISHED', 'FLAGGED', 'REMOVED'].includes(statusParam)
        ? { status: statusParam as ReviewStatus }
        : {}),
    }

    const [total, reviews] = await Promise.all([
      prisma.schoolReview.count({ where }),
      prisma.schoolReview.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          parent: { select: { name: true, phone: true } },
          school: { select: { id: true, name: true, slug: true } },
          reports: { orderBy: { createdAt: 'desc' } },
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { reviews, total, page, limit } })
  } catch (error) {
    console.error('GET /api/admin/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
