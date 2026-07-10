// Parent portal: all reviews the logged-in parent has written, across
// schools/centres, with status + response threads (My Reviews page).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent } from '@/lib/reviews/parent-auth'

export async function GET(_req: NextRequest) {
  try {
    const authResult = await requireParent()
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const reviews = await prisma.schoolReview.findMany({
      where: { parentId: authResult.parent.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: { id: true, name: true, slug: true, institutionType: true },
        },
        responses: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { id: true, authorType: true, body: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: { reviews } })
  } catch (error) {
    console.error('GET /api/v1/parent/reviews error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
