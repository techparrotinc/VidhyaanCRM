// Owner-only review deletion (soft delete). PRD: "Parent can delete their own
// review". Vidhyaan (admin) deletion lives under /api/admin/reviews.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent } from '@/lib/reviews/parent-auth'
import { recomputeSchoolRating } from '@/lib/reviews/aggregate'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const authResult = await requireParent()
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const review = await prisma.schoolReview.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, parentId: true, schoolId: true },
    })
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }
    if (review.parentId !== authResult.parent.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own review' },
        { status: 403 }
      )
    }

    await prisma.schoolReview.update({
      where: { id: review.id },
      data: { deletedAt: new Date() },
    })
    await recomputeSchoolRating(review.schoolId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/v1/reviews/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
