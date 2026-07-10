// Lets the school profile page decide whether to show "Write a Review" and
// whether the parent already has a review. Unauthenticated → eligible:false
// with loggedIn:false (page then prompts parent login instead of 401 noise).

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getReviewEligibility } from '@/lib/reviews/eligibility'
import { canWriteNewReview } from '@/lib/reviews/window'

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.nextUrl.searchParams.get('schoolId')
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId required' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json({
        success: true,
        data: { loggedIn: false, eligible: false, verified: false, existingReviewId: null },
      })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) {
      return NextResponse.json({
        success: true,
        data: { loggedIn: false, eligible: false, verified: false, existingReviewId: null },
      })
    }

    const [eligibility, ownReviews, kids] = await Promise.all([
      getReviewEligibility(parent.id, schoolId),
      prisma.schoolReview.findMany({
        where: { parentId: parent.id, schoolId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, kidId: true, createdAt: true, status: true },
      }),
      prisma.kidProfile.findMany({
        where: { parentId: parent.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true },
      }),
    ])

    // Per kid-bucket (null = general): the latest review; editable while it
    // is younger than the 6-month window, else a new review may be written.
    const seenBuckets = new Set<string>()
    const reviewSlots: {
      kidId: string | null
      reviewId: string
      canWriteNew: boolean
    }[] = []
    for (const r of ownReviews) {
      const bucket = r.kidId ?? '__general__'
      if (seenBuckets.has(bucket)) continue // only latest per bucket
      seenBuckets.add(bucket)
      reviewSlots.push({
        kidId: r.kidId,
        reviewId: r.id,
        canWriteNew: canWriteNewReview(r.createdAt),
      })
    }

    // Back-compat: id of the latest still-editable review (any bucket)
    const editable = reviewSlots.find((s) => !s.canWriteNew)

    return NextResponse.json({
      success: true,
      data: {
        loggedIn: true,
        eligible: eligibility.eligible,
        verified: eligibility.verified,
        reason: eligibility.reason ?? null,
        existingReviewId: editable?.reviewId ?? null,
        kids,
        reviewSlots,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/reviews/eligibility error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
