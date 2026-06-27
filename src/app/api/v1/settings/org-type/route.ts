import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'

export const GET = route({
  handler: async ({ db, user }) => {
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { institutionType: true }
    })
    return ok({ institutionType: org?.institutionType || 'SCHOOL' })
  }
})
