import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const feePlanSchema = z.object({
  name: z.string().min(1),
  gradeLabel: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
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
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Fee Plan')
    }

    const plan = await db.feePlanTemplate.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!plan) {
      throw Errors.notFound('Fee Plan')
    }
    return ok(plan)
  }
})

export const PUT = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Fee Plan')
    }

    const body = feePlanSchema.partial().parse(await req.json())

    if (body.structure?.heads) {
      body.structure.heads = body.structure.heads.map(head => ({
        ...head,
        assignedTermOrder: head.appliesTo === 'CUSTOM' ? (head.assignedTermOrder ?? null) : null
      }))
    }

    const existing = await db.feePlanTemplate.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Fee Plan')
    }

    const updated = await db.feePlanTemplate.update({
      where: { id },
      data: {
        name: body.name,
        gradeLabel: body.gradeLabel !== undefined ? body.gradeLabel : undefined,
        courseId: body.courseId !== undefined ? body.courseId : undefined,
        institutionType: body.institutionType !== undefined ? body.institutionType : undefined,
        structure: body.structure !== undefined ? (body.structure || { heads: [] }) : undefined
      }
    })
    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Fee Plan')
    }

    const existing = await db.feePlanTemplate.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Fee Plan')
    }

    await db.feePlanTemplate.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    return ok({ success: true })
  }
})
