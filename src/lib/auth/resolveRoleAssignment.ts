import { prisma } from '@/lib/db/client'

export class MultiRoleSelectionRequiredError extends Error {
  public readonly assignments: Array<{ id: string; role: string; orgId: string | null }>

  constructor(assignments: Array<{ id: string; role: string; orgId: string | null }>) {
    super('MULTIPLE_ROLE_ASSIGNMENTS_REQUIRE_SELECTION')
    this.assignments = assignments
    this.name = 'MultiRoleSelectionRequiredError'
  }
}

export async function resolveActiveRoleAssignment(
  userId: string,
  assignmentId?: string | null
): Promise<{ role: string; orgId: string | null; activeRoleAssignmentId: string }> {
  const activeAssignments = await prisma.userRoleAssignment.findMany({
    where: { userId, status: 'ACTIVE' }
  })

  if (activeAssignments.length === 0) {
    throw new Error(
      `No active UserRoleAssignment found for userId=${userId}. ` +
      `Every user must have at least one active assignment post-migration.`
    )
  }

  if (activeAssignments.length === 1) {
    const item = activeAssignments[0]
    return { role: item.role, orgId: item.orgId, activeRoleAssignmentId: item.id }
  }

  if (assignmentId) {
    const matching = activeAssignments.find((a) => a.id === assignmentId)
    if (matching) {
      return { role: matching.role, orgId: matching.orgId, activeRoleAssignmentId: matching.id }
    }
  }

  throw new MultiRoleSelectionRequiredError(
    activeAssignments.map((a) => ({ id: a.id, role: a.role, orgId: a.orgId }))
  )
}
