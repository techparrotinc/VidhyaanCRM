import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'

export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ user }) => {
    const counsellors = await prisma.user.findMany({
      where: {
        orgId: user.orgId,
        role: {
          in: [
            'COUNSELLOR',
            'BRANCH_ADMIN',
            'ORG_ADMIN'
          ]
        },
        status: 'ACTIVE',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true
      },
      orderBy: { name: 'asc' }
    })

    return ok(counsellors)
  }
})
