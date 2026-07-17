import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { isOverLeadCap } from '@/lib/billing/plan-status'

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
      const where: any = { id: { in: body.ids }, deletedAt: null }
      let skippedQueued = 0

      // Same gate as the single-lead PUT: converting a queued (past-leadCap)
      // lead is the actual value being restricted. Re-checked live per
      // request, not a stale flag — an org that's since upgraded converts
      // freely again.
      if (body.status === 'CONVERTED') {
        const org = await db.organization.findUnique({
          where: { id: user.orgId },
          select: { status: true, leadCap: true, plan: { select: { slug: true, monthlyPrice: true } } }
        })
        if (org && (await isOverLeadCap(db, user.orgId, org))) {
          skippedQueued = await db.lead.count({
            where: { id: { in: body.ids }, queued: true, deletedAt: null }
          })
          where.queued = false
        }
      }

      const result = await db.lead.updateMany({ where, data: { status: body.status } })
      return ok({ updated: result.count, skippedQueued })
    }

    // delete — tenant client rewrites deleteMany → soft delete for Lead
    const result: any = await db.lead.deleteMany({
      where: { id: { in: body.ids } }
    })
    return ok({ deleted: result.count ?? body.ids.length })
  }
})
