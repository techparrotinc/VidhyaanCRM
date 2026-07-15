// Vidhyaan moderation decision on a single review: REMOVED (delete any
// review — PRD "Vidhyaan can delete any review") or PUBLISHED (restore a
// flagged one, clearing the flag).

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { recomputeSchoolRating } from '@/lib/reviews/aggregate'
import { createNotification } from '@/lib/services/notifications'
import { resolveAdminUser } from '@/lib/admin-auth'

const ADMIN_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']

const patchSchema = z.object({
  status: z.enum(['PUBLISHED', 'REMOVED']),
  reason: z.string().trim().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await resolveAdminUser(req)
    if (!admin || !ADMIN_ROLES.includes(admin.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'status must be PUBLISHED or REMOVED' },
        { status: 422 }
      )
    }

    const review = await prisma.schoolReview.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        parentId: true,
        school: { select: { name: true, slug: true, orgId: true, institutionType: true } },
      },
    })
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    const updated = await prisma.schoolReview.update({
      where: { id },
      data: {
        status: parsed.data.status,
        flagReason:
          parsed.data.status === 'PUBLISHED'
            ? null // restore clears the flag
            : parsed.data.reason || 'Removed by Vidhyaan moderation',
      },
    })
    await recomputeSchoolRating(review.schoolId)

    // Tell the parent what happened to their review (removed reviews vanishing
    // silently creates support tickets). Fire-and-forget.
    const profilePath =
      review.school.institutionType === 'LEARNING_CENTER' ? 'learning-centers' : 'schools'
    createNotification({
      orgId: review.school.orgId ?? '',
      recipientType: 'PARENT',
      recipientId: review.parentId,
      type: 'REVIEW_MODERATED',
      title:
        parsed.data.status === 'REMOVED'
          ? `Your review of ${review.school.name} was removed`
          : `Your review of ${review.school.name} is live again`,
      body:
        parsed.data.status === 'REMOVED'
          ? parsed.data.reason ||
            'After moderation, your review was found to violate our review guidelines.'
          : 'Our moderation team restored your review after checking the report against it.',
      data: { href: `/${profilePath}/${review.school.slug}#reviews`, reviewId: id },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: { review: updated } })
  } catch (error) {
    console.error('PATCH /api/admin/reviews/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
