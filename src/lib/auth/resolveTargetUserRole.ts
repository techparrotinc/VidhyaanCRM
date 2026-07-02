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

  if (assignments.length > 0) return assignments[0].role

  // Legacy fallback while User.role column still exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  return user?.role ?? null
}
