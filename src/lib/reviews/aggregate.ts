// Recompute the denormalized School.avgRating / reviewCount after any review
// write (create/update/delete/moderation). Counts PUBLISHED, non-deleted only.

import { prisma } from '@/lib/db'

export async function recomputeSchoolRating(schoolId: string): Promise<void> {
  const agg = await prisma.schoolReview.aggregate({
    where: { schoolId, status: 'PUBLISHED', deletedAt: null },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  })
}
