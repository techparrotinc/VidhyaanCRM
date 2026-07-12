import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db'

export const GET = route({
  handler: async ({ user }) => {
    // Admins are assignable too — small orgs have no dedicated counsellor,
    // and the lead form requires an assignee.
    const counsellors = await prisma.user.findMany({
      where: {
        orgId: user.orgId,
        roleAssignments: {
          some: {
            role: { in: ['COUNSELLOR', 'ORG_ADMIN', 'BRANCH_ADMIN'] },
            status: 'ACTIVE'
          }
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      }
    })
    return ok(counsellors)
  }
})
