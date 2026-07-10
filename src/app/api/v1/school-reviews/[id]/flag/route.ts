// School flags a review on its own profile. PRD: school can FLAG only —
// removal is Vidhyaan's (platform admin's) decision. Flagging an already
// FLAGGED/REMOVED review is a no-op error.

import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { recomputeSchoolRating } from '@/lib/reviews/aggregate'
import { alertModeratorsReviewFlagged } from '@/lib/reviews/moderation-alert'

const flagSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, user, params }) => {
    const parsed = flagSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      throw Errors.businessRule('A reason (3-500 chars) is required to flag a review')
    }

    const review = await prisma.schoolReview.findFirst({
      where: { id: params?.id, deletedAt: null },
      include: { school: { select: { orgId: true, name: true } } },
    })
    if (!review) throw Errors.notFound('Review')
    if (review.school.orgId !== user.orgId) {
      throw Errors.forbidden('You can only flag reviews on your own school profile')
    }
    if (review.status !== 'PUBLISHED') {
      throw Errors.businessRule('Review is already flagged or removed')
    }

    const updated = await prisma.schoolReview.update({
      where: { id: review.id },
      data: {
        status: 'FLAGGED',
        flagReason: `School flagged: ${parsed.data.reason}`,
      },
    })
    await recomputeSchoolRating(review.schoolId)

    alertModeratorsReviewFlagged({
      reviewId: review.id,
      schoolName: review.school.name,
      flaggedBy: `the school (reason: ${parsed.data.reason})`,
    }).catch(() => {})

    return ok({ review: updated })
  },
})
