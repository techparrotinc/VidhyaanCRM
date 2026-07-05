import { route } from '@/lib/api/compose'
import { z } from 'zod'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const PUT = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const enrollmentId = resolvedParams?.enrollmentId
    if (!enrollmentId) {
      throw Errors.notFound('Enrollment')
    }
    const body = z.object({
      status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
      endDate: z.string().max(40).optional().nullable()
    }).parse(await req.json())

    const existing = await db.courseEnrollment.findFirst({
      where: { id: enrollmentId, orgId: user.orgId }
    })
    if (!existing) {
      throw Errors.notFound('Enrollment')
    }

    const updated = await db.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: body.status,
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
    const enrollmentId = resolvedParams?.enrollmentId
    if (!enrollmentId) {
      throw Errors.notFound('Enrollment')
    }

    const existing = await db.courseEnrollment.findFirst({
      where: { id: enrollmentId, orgId: user.orgId }
    })
    if (!existing) {
      throw Errors.notFound('Enrollment')
    }

    await db.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'CANCELLED',
        endDate: new Date()
      }
    })

    return ok({ success: true })
  }
})
