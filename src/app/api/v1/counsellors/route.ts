import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db'

export const GET = route({
  handler: async ({ user }) => {
    const counsellors = await prisma.user.findMany({
      where: {
        orgId: user.orgId,
        role: 'COUNSELLOR',
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
