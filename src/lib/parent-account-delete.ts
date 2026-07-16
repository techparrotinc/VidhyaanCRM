import { prisma } from '@/lib/db/client'
import { revokeAssignment } from '@/lib/auth/roleRevocation'

/**
 * Parent account deletion (DPDP right to erasure) — shared by the web
 * session route and the mobile Bearer route. Soft-deletes + anonymizes the
 * Parent (and the User when no other active role remains); the 30-day
 * cleanup cron hard-purges rows flagged deletedAt.
 */
export async function deleteParentAccount(
  userId: string,
  activeRoleAssignmentId: string | null
): Promise<{ ok: true; identityRemoved: boolean } | { ok: false; error: string; status: number }> {
  const parent = await prisma.parent.findUnique({ where: { userId } })
  if (!parent) return { ok: false, error: 'Parent record not found', status: 404 }

  let remainingActiveCount = 0
  if (activeRoleAssignmentId) {
    remainingActiveCount = await prisma.userRoleAssignment.count({
      where: { userId, status: 'ACTIVE', id: { not: activeRoleAssignmentId } }
    })
  }
  const shouldAnonymizeUser = !activeRoleAssignmentId || remainingActiveCount === 0

  await prisma.$transaction(async (tx) => {
    const now = new Date()
    const anonymizedId = parent.id.slice(-6)

    await tx.parent.update({
      where: { id: parent.id },
      data: {
        deletedAt: now,
        name: 'Anonymized Parent',
        phone: `deleted_${anonymizedId}_${parent.id}`,
        email: `deleted_parent_${parent.id}@deleted.vidhyaan.com`,
        city: null
      }
    })
    await tx.parentBookmark.deleteMany({ where: { parentId: parent.id } })
    await tx.parentEnquiry.updateMany({
      where: { parentId: parent.id },
      data: { kidName: null, message: 'Anonymized for privacy (DPDP)' }
    })
    await tx.parentApplication.updateMany({
      where: { parentId: parent.id },
      data: { kidName: 'Anonymized Child' }
    })
    if (activeRoleAssignmentId) {
      await tx.userRoleAssignment.update({
        where: { id: activeRoleAssignmentId },
        data: { status: 'REVOKED' }
      })
    }
    if (shouldAnonymizeUser) {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          status: 'DEACTIVATED',
          name: 'Deleted Parent User',
          phone: `deleted_${anonymizedId}_${userId}`,
          email: `deleted_user_${userId}@deleted.vidhyaan.com`
        }
      })
    }
  })

  if (activeRoleAssignmentId) {
    await revokeAssignment(userId, activeRoleAssignmentId)
  }

  return { ok: true, identityRemoved: shouldAnonymizeUser }
}
