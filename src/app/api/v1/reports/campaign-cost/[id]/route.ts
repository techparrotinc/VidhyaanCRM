import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'

const bodySchema = z.object({
  // null clears the spend; numbers are rupees (non-negative).
  cost: z.number().min(0).max(1e9).nullable()
})

// Inline "Spend" edit on the Campaign Effectiveness report. Campaign is a
// tenant model, so db writes are org-scoped by forOrg.
export const PATCH = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['ORG_ADMIN'],
  handler: async ({ req, db, params }) => {
    const { cost } = bodySchema.parse(await req.json())
    const campaign = await db.campaign.findFirst({ where: { id: params?.id } })
    if (!campaign) throw Errors.notFound('Campaign')

    await db.campaign.update({
      where: { id: campaign.id },
      data: { costAmount: cost }
    })
    return ok({ id: campaign.id, cost })
  }
})
