// Public paginated reviews for a school profile (published only).
// Supports sort=recent|highest|lowest and page/pageSize for "Show more".

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const pageSize = Math.min(25, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10') || 10))
    const sort = searchParams.get('sort') ?? 'recent'

    const school = await prisma.school.findFirst({
      where: { OR: [{ slug }, { id: slug }], isDummy: false, isPublished: true },
      select: { id: true },
    })
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
    }

    const orderBy =
      sort === 'highest'
        ? [{ rating: 'desc' as const }, { createdAt: 'desc' as const }]
        : sort === 'lowest'
          ? [{ rating: 'asc' as const }, { createdAt: 'desc' as const }]
          : [{ createdAt: 'desc' as const }]

    const where = { schoolId: school.id, status: 'PUBLISHED' as const, deletedAt: null }
    const [total, reviews] = await Promise.all([
      prisma.schoolReview.count({ where }),
      prisma.schoolReview.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          parent: { select: { name: true } },
          responses: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true, authorType: true, body: true, createdAt: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: { reviews, total, page, pageSize, hasMore: page * pageSize < total },
    })
  } catch (error) {
    console.error('GET /api/public/schools/[slug]/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
