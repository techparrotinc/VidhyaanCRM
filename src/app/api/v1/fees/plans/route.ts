import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const feePlanSchema = z.object({
  name: z.string().min(1),
  gradeLabel: z.string().nullable().optional(),
  institutionType: z.string().nullable().optional(),
  structure: z.object({
    heads: z.array(z.object({
      id: z.string(),
      name: z.string(),
      frequency: z.enum([
        'ONE_TIME', 'MONTHLY',
        'QUARTERLY', 'HALF_YEARLY',
        'ANNUAL', 'CUSTOM'
      ]),
      amount: z.number().min(0),
      isOptional: z.boolean().default(false),
      appliesTo: z.enum([
        'ALL_TERMS',
        'FIRST_TERM',
        'LAST_TERM',
        'CUSTOM'
      ]).default('ALL_TERMS'),
      assignedTermOrder: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.null()
      ]).optional().nullable()
    }))
  }).nullable().optional()
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined

    const where: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (gradeLabel) {
      where.gradeLabel = gradeLabel
    }

    const plans = await db.feePlanTemplate.findMany({
      where,
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
    const body = feePlanSchema.parse(await req.json())

    if (body.structure?.heads) {
      body.structure.heads = body.structure.heads.map(head => ({
        ...head,
        assignedTermOrder: head.appliesTo === 'CUSTOM' ? (head.assignedTermOrder ?? null) : null
      }))
    }

    let instType = body.institutionType
    if (!instType) {
      const org = await db.organization.findUnique({
        where: { id: user.orgId },
        select: { institutionType: true }
      })
      instType = org?.institutionType || 'SCHOOL'
    }

    const plan = await db.feePlanTemplate.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        gradeLabel: body.gradeLabel || null,
        institutionType: instType,
        structure: body.structure || { heads: [] }
      }
    })

    return created(plan)
  }
})
