import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const bulkSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('assign'),
    ids: z.array(z.string().min(1).max(50)).min(1).max(500),
    assignedToId: z.string().min(1).max(50)
  }),
  z.object({
    action: z.literal('status'),
    ids: z.array(z.string().min(1).max(50)).min(1).max(500),
    status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'])
  }),
  z.object({
    action: z.literal('delete'),
    ids: z.array(z.string().min(1).max(50)).min(1).max(500)
  })
])

export const POST = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user }) => {
    const body = bulkSchema.parse(await req.json())

    if (body.action === 'assign') {
      const counsellor = await db.user.findFirst({
        where: { id: body.assignedToId, orgId: user.orgId, deletedAt: null },
        select: { id: true }
      })
      if (!counsellor) throw Errors.notFound('Counsellor')

      const result = await db.lead.updateMany({
        where: { id: { in: body.ids }, deletedAt: null },
        data: { assignedToId: body.assignedToId }
      })
      return ok({ updated: result.count })
    }

    if (body.action === 'status') {
      const result = await db.lead.updateMany({
        where: { id: { in: body.ids }, deletedAt: null },
        data: { status: body.status }
      })
      return ok({ updated: result.count })
    }

    // delete — tenant client rewrites deleteMany → soft delete for Lead
    const result: any = await db.lead.deleteMany({
      where: { id: { in: body.ids } }
    })
    return ok({ deleted: result.count ?? body.ids.length })
  }
})
