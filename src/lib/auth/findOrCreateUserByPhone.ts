import { User, UserRole, UserStatus } from '@prisma/client'
import { prisma } from '@/lib/db/client'

// Roles deliberately excluded from UserRoleAssignment per Gap 14 (internal staff, no parallel identity)
const INTERNAL_ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.OPERATIONS_ADMIN,
  UserRole.SUPPORT_ADMIN
]

/**
 * findOrCreateUserByPhone helper function
 * 
 * HARD BLOCK SEMANTICS:
 * This helper implements a strict block design. If a user already exists
 * with the given phone number, we return the existing user with isNewUser: false.
 * We do NOT modify their role or other attributes.
 * 
 * Note: Self-service multi-role registration (allowing an existing phone to
 * gain a new role via these forms) is explicitly deferred.
 * See Vidhyaan_Multi_Role_Identity_PRD.md Section 2, non-goals.
 */
export async function findOrCreateUserByPhone(params: {
  phone: string
  name: string
  email?: string | null
  role: UserRole
  orgId?: string | null
  status?: UserStatus
}): Promise<{ user: User; isNewUser: boolean }> {
  // 1. Look up existing User by phone only
  const existingUser = await prisma.user.findFirst({
    where: {
      phone: params.phone,
      deletedAt: null
    }
  })

  // 2. If existing user is found, return immediately
  if (existingUser) {
    return { user: existingUser, isNewUser: false }
  }

  // 3. If no existing user, create a new User and its UserRoleAssignment
  const newUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        phone: params.phone,
        name: params.name,
        email: params.email ?? null,
        role: params.role,
        orgId: params.orgId ?? null,
        status: params.status ?? 'ACTIVE'
      }
    })

    if (!INTERNAL_ADMIN_ROLES.includes(params.role)) {
      await tx.userRoleAssignment.create({
        data: {
          userId: createdUser.id,
          role: params.role,
          orgId: params.orgId ?? null,
          status: 'ACTIVE',
          isDefault: true
        }
      })
    }

    return createdUser
  })

  return { user: newUser, isNewUser: true }
}
