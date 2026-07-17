import { prisma } from '@/lib/db'
import { Errors } from '@/lib/api/errors'

export const FREE_TIER_LIMITS = {
  USERS: 2,
  STUDENTS: 25
} as const

/**
 * Free-tier caps (strategy doc §7): 2 users, 25 student records.
 * Applies only when the org has no active paid subscription AND is not in
 * an active trial (the 7-day trial runs uncapped on Enterprise modules).
 * Throws a 403 AppError with an upgrade hint when the cap is hit.
 */
/**
 * True when the org is actually subject to the free-tier caps (no paid
 * subscription, not mid-trial). Shared by assertFreeTierLimit and any
 * bulk-creation path that needs to enforce the cap incrementally instead of
 * with a single before/after check.
 */
export async function isFreeTierCapped(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      trialEndsAt: true,
      plan: { select: { slug: true } },
      subscriptions: {
        where: { deletedAt: null, status: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
        select: { amount: true },
        take: 1
      }
    }
  })
  if (!org) return false

  const hasPaidAccess = org.subscriptions.some((s) => Number(s.amount) >= 0 && org.plan?.slug !== 'free')
  const inTrial = !!org.trialEndsAt && org.trialEndsAt > new Date()
  return !hasPaidAccess && !inTrial
}

export async function assertFreeTierLimit(orgId: string, kind: 'USER' | 'STUDENT'): Promise<void> {
  if (!(await isFreeTierCapped(orgId))) return

  if (kind === 'USER') {
    const count = await prisma.user.count({ where: { orgId, deletedAt: null } })
    if (count >= FREE_TIER_LIMITS.USERS) {
      throw Errors.forbidden(
        `Free listing includes up to ${FREE_TIER_LIMITS.USERS} users. Upgrade a plan to add your whole team.`
      )
    }
  } else {
    const count = await prisma.student.count({ where: { orgId, deletedAt: null } })
    if (count >= FREE_TIER_LIMITS.STUDENTS) {
      throw Errors.forbidden(
        `Free listing includes up to ${FREE_TIER_LIMITS.STUDENTS} student records. Upgrade a plan for unlimited students.`
      )
    }
  }
}
