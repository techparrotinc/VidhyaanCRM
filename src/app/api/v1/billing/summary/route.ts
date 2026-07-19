import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { slabForStudents } from '@/lib/pricing/catalog'

/**
 * Read-only subscription snapshot for admins (used by the AI copilot; the
 * full /api/v1/billing payload is session-only and carries checkout data
 * this consumer must not need). Composed via route() so the AI service
 * token works and RBAC/module checks run as usual. No module gate —
 * subscription state matters on every plan.
 */
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user, db }) => {
    const [org, sub, studentCount] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { plan: { select: { name: true, slug: true } } }
      }),
      prisma.subscription.findFirst({
        where: { orgId: user.orgId },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          billingCycle: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          graceEndsAt: true,
          cancelAtPeriodEnd: true,
          plan: { select: { name: true, slug: true } }
        }
      }),
      db.student.count({ where: { deletedAt: null, status: 'ACTIVE' } })
    ])
    const slab = slabForStudents(studentCount)
    return ok({
      plan: sub?.plan?.name ?? org?.plan?.name ?? 'Free',
      planSlug: sub?.plan?.slug ?? org?.plan?.slug ?? 'free',
      status: sub?.status ?? 'NONE',
      billingCycle: sub?.billingCycle ?? null,
      trialEndsAt: sub?.trialEndsAt ?? null,
      renewsAt: sub?.currentPeriodEnd ?? null,
      graceEndsAt: sub?.graceEndsAt ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      activeStudents: studentCount,
      slab
    })
  }
})
