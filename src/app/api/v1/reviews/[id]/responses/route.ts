// Review response thread (PRD: "Full conversation thread allowed").
// Authors: the school that owns the profile (org roles) or the parent who
// wrote the review. Thread is public; writes are author-checked here.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createNotification, notifyOrgAdmins } from '@/lib/services/notifications'

const ORG_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'ACCOUNTANT'])

const bodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const responses = await prisma.reviewResponse.findMany({
      where: { reviewId: id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, authorType: true, body: true, createdAt: true },
    })
    return NextResponse.json({ success: true, data: { responses } })
  } catch (error) {
    console.error('GET /api/v1/reviews/[id]/responses error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'body (1-2000 chars) required' },
        { status: 422 }
      )
    }

    const review = await prisma.schoolReview.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { orgId: true, name: true, slug: true, institutionType: true } },
      },
    })
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    // Resolve author: school-side org member or the review's own parent
    let authorType: 'SCHOOL' | 'PARENT' | 'VIDHYAAN' | null = null
    let authorId: string | null = null
    let orgId: string | null = null

    const role = session.user.role || ''
    if (ORG_ROLES.has(role)) {
      if (!review.school.orgId || review.school.orgId !== session.user.orgId) {
        return NextResponse.json(
          { success: false, error: 'You can only respond to reviews on your own school profile' },
          { status: 403 }
        )
      }
      authorType = 'SCHOOL'
      authorId = session.user.id
      orgId = session.user.orgId
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      if (!parent || parent.id !== review.parentId) {
        return NextResponse.json(
          { success: false, error: 'Only the review author can reply in this thread' },
          { status: 403 }
        )
      }
      authorType = 'PARENT'
      authorId = parent.id
    } else if (['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role)) {
      authorType = 'VIDHYAAN'
      authorId = session.user.id
    }

    if (!authorType) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const response = await prisma.reviewResponse.create({
      data: { reviewId: id, orgId, authorType, authorId, body: parsed.data.body },
    })

    // Notify the other side of the thread (fire-and-forget)
    const profilePath =
      review.school.institutionType === 'LEARNING_CENTER' ? 'learning-centers' : 'schools'
    const publicHref = `/${profilePath}/${review.school.slug}#reviews`
    if (authorType === 'SCHOOL' || authorType === 'VIDHYAAN') {
      // → parent who wrote the review
      createNotification({
        orgId: review.school.orgId ?? review.orgId ?? '',
        recipientType: 'PARENT',
        recipientId: review.parentId,
        type: 'REVIEW_REPLY',
        title:
          authorType === 'SCHOOL'
            ? `${review.school.name} replied to your review`
            : 'Vidhyaan replied to your review',
        body: parsed.data.body.slice(0, 200),
        data: { href: publicHref, reviewId: id },
      }).catch(() => {})
    } else if (authorType === 'PARENT' && review.school.orgId) {
      // → school admins
      notifyOrgAdmins(review.school.orgId, {
        type: 'REVIEW_REPLY',
        title: 'A parent replied on a review thread',
        body: parsed.data.body.slice(0, 200),
        data: { href: '/settings/reviews', reviewId: id },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, data: { response } }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/reviews/[id]/responses error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
