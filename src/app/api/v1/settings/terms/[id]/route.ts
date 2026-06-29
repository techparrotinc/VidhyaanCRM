import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const termSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  academicYearId: z.string().min(1),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true)
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
      throw Errors.notFound('Term')
    }

    const body = termSchema.partial().parse(await req.json())

    const existing = await db.term.findFirst({
      where: { id, orgId: user.orgId }
    })
    if (!existing) {
      throw Errors.notFound('Term')
    }

    const updated = await db.term.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
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
      throw Errors.notFound('Term')
    }

    const existing = await db.term.findFirst({
      where: { id, orgId: user.orgId }
    })
    if (!existing) {
      throw Errors.notFound('Term')
    }

    await db.term.delete({
      where: { id }
    })

    return ok({ success: true })
  }
})
