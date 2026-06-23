import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db }) => {
    const plans = await db.feePlanTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return ok(plans)
  }
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      frequency: z.string().default('MONTHLY'),
      amount: z.number().min(0),
      dueDay: z.number().min(1).max(31).default(10),
      lateFeeAmount: z.number().min(0).default(0),
      lateFeeGraceDays: z.number().min(0).default(3)
    }).parse(await req.json())

    const plan = await db.feePlanTemplate.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        structure: [
          {
            head: body.name,
            amount: body.amount,
            frequency: body.frequency,
            dueDay: body.dueDay,
            lateFeeAmount: body.lateFeeAmount,
            lateFeeGraceDays: body.lateFeeGraceDays,
            description: body.description ?? ''
          }
        ]
      }
    })

    return created(plan)
  }
})
