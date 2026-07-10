// Report a review (any logged-in parent, or anonymous with a session key).
// PRD: auto-publish, flag if reported. At REPORT_AUTO_FLAG_THRESHOLD distinct
// reports the review flips to FLAGGED (hidden from public) pending Vidhyaan
// decision — schools/parents never remove content directly here.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recomputeSchoolRating } from '@/lib/reviews/aggregate'
import { alertModeratorsReviewFlagged } from '@/lib/reviews/moderation-alert'

const REPORT_AUTO_FLAG_THRESHOLD = 3

const reportSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsed = reportSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'A reason (3-500 chars) is required' },
        { status: 422 }
      )
    }

    const review = await prisma.schoolReview.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        status: true,
        parentId: true,
        school: { select: { name: true } },
      },
    })
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    // Identify the reporter: parent id when logged in, else a hashed ip key
    const session = await auth()
    let reporterParentId: string | null = null
    if (session?.user && session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      reporterParentId = parent?.id ?? null
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const reporterKey = reporterParentId
      ? null
      : createHash('sha256').update(`${id}:${ip}`).digest('hex')

    if (reporterParentId && reporterParentId === review.parentId) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own review' },
        { status: 400 }
      )
    }

    // Dedup: one report per parent (unique constraint) / per anon key
    const existing = await prisma.reviewReport.findFirst({
      where: {
        reviewId: id,
        ...(reporterParentId ? { reporterParentId } : { reporterKey }),
      },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this review' },
        { status: 409 }
      )
    }

    await prisma.reviewReport.create({
      data: { reviewId: id, reporterParentId, reporterKey, reason: parsed.data.reason },
    })

    // Auto-flag at threshold (distinct reports)
    const reportCount = await prisma.reviewReport.count({ where: { reviewId: id } })
    let flagged = false
    if (reportCount >= REPORT_AUTO_FLAG_THRESHOLD && review.status === 'PUBLISHED') {
      await prisma.schoolReview.update({
        where: { id },
        data: { status: 'FLAGGED', flagReason: `Auto-flagged: ${reportCount} user reports` },
      })
      await recomputeSchoolRating(review.schoolId)
      flagged = true
      alertModeratorsReviewFlagged({
        reviewId: id,
        schoolName: review.school.name,
        flaggedBy: `${reportCount} user reports`,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, data: { reportCount, flagged } })
  } catch (error) {
    console.error('POST /api/v1/reviews/[id]/report error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
