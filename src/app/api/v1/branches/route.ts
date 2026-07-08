import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { prisma } from '@/lib/db'
import { bustBranchCaches } from '@/lib/branches'
import { ROLES } from '@/constants/roles'

const branchSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(20).optional().nullable(),
  addressLine: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable()
})

// Switcher + settings list. Branch-restricted roles only see their granted
// branches (full grant set, not the currently narrowed one — the switcher
// must always offer the way back).
export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ user }) => {
    const restricted = user.role === ROLES.BRANCH_ADMIN
    const grantedIds = restricted
      ? (await prisma.userBranchAccess.findMany({
          where: { userId: user.id },
          select: { branchId: true }
        })).map(g => g.branchId)
      : null

    const branches = await prisma.branch.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null,
        ...(grantedIds ? { id: { in: grantedIds } } : {})
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true, name: true, code: true, isDefault: true,
        addressLine: true, city: true, state: true, pincode: true,
        phone: true, email: true, createdAt: true
      }
    })
    return ok(branches)
  }
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const body = branchSchema.parse(await req.json())
    const existing = await prisma.branch.count({
      where: { orgId: user.orgId, deletedAt: null }
    })
    const branch = await prisma.branch.create({
      data: {
        ...body,
        orgId: user.orgId,
        // First branch of the org becomes the default automatically
        isDefault: existing === 0
      }
    })
    await bustBranchCaches(user.orgId)
    return created(branch)
  }
})
