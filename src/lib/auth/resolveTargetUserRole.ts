import { prisma } from '@/lib/db/client'

export async function resolveTargetUserRole(
  userId: string,
  orgId?: string | null
): Promise<string | null> {
  const where: any = { userId, status: 'ACTIVE' }
  if (orgId) where.orgId = orgId

  const assignments = await prisma.userRoleAssignment.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { lastUsedAt: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  return assignments.length > 0 ? assignments[0].role : null
}
