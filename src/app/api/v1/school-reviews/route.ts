// Org-side view of the school's own marketplace reviews (all statuses), with
// report counts and response threads, for /settings/reviews.

import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    const schools = await prisma.school.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: { id: true, name: true, institutionType: true },
    })
    const schoolIds = schools.map((s) => s.id)

    const reviews = await prisma.schoolReview.findMany({
      where: { schoolId: { in: schoolIds }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { name: true } },
        school: { select: { id: true, name: true, institutionType: true } },
        responses: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { reports: true } },
      },
    })

    return ok({ reviews, schools })
  },
})
