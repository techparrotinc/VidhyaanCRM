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
  user: { id: string; role: string | null; orgId: string | null },
  assignmentId?: string | null
): Promise<{ role: string; orgId: string | null; activeRoleAssignmentId: string | null }> {
  // 1. Query active assignments
  const activeAssignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId: user.id,
      status: 'ACTIVE'
    }
  })

  // 2. Legacy fallback
  if (activeAssignments.length === 0) {
    return {
      role: user.role as string,
      orgId: user.orgId,
      activeRoleAssignmentId: null
    }
  }

  // 3. Exactly one active assignment
  if (activeAssignments.length === 1) {
    const item = activeAssignments[0]
    return {
      role: item.role,
      orgId: item.orgId,
      activeRoleAssignmentId: item.id
    }
  }

  // 4. Two or more active assignments
  if (assignmentId) {
    const matching = activeAssignments.find((a) => a.id === assignmentId)
    if (matching) {
      return {
        role: matching.role,
        orgId: matching.orgId,
        activeRoleAssignmentId: matching.id
      }
    }
  }

  // No matching or no assignmentId passed
  throw new MultiRoleSelectionRequiredError(
    activeAssignments.map((a) => ({
      id: a.id,
      role: a.role,
      orgId: a.orgId
    }))
  )
}
