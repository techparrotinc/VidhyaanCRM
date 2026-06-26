import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, params, user }) => {
    const body = z.object({
      name: z.string().optional(),
      color: z.string().optional(),
      requiresDocs: z.boolean().optional(),
      requiresPayment: z.boolean().optional(),
      order: z.number().optional()
    }).parse(await req.json())

    const stage = await db.admissionStage.findFirst({
      where: { id: params?.id, orgId: user.orgId }
    })

    if (!stage) {
      throw Errors.notFound('Stage')
    }

    if (stage.isWon || stage.isLost) {
      throw Errors.businessRule(
        'Terminal stages cannot be modified'
      )
    }

    const { order, ...dataRest } = body
    const updateData: any = { ...dataRest }
    if (order !== undefined) {
      updateData.sortOrder = order
    }

    const updated = await db.admissionStage.update({
      where: { id: params?.id },
      data: updateData
    })

    // Invalidate settings cache
    await redis.del(`pipeline:${user.orgId}`)

    return ok(updated)
  }
})

export const DELETE = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db, params, user }) => {
    const stage = await db.admissionStage.findFirst({
      where: { id: params?.id, orgId: user.orgId }
    })

    if (!stage) {
      throw Errors.notFound('Stage')
    }

    if (stage.isWon || stage.isLost) {
      throw Errors.businessRule(
        'Terminal stages cannot be deleted'
      )
    }

    const admissionsInStage = await db.admission.count({
      where: { stageId: params?.id, deletedAt: null }
    })

    if (admissionsInStage > 0) {
      throw Errors.businessRule(
        'Cannot delete stage with ' +
        admissionsInStage +
        ' active admissions'
      )
    }

    await db.admissionStage.delete({
      where: { id: params?.id }
    })

    // Invalidate settings cache
    await redis.del(`pipeline:${user.orgId}`)

    return ok({ deleted: true })
  }
})
