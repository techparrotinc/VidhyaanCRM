import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { ActivityType } from '@prisma/client'

export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user, params }) => {
    const body = z
      .object({
        type: z.nativeEnum(ActivityType),
        summary: z.string().min(1),
        metadata: z.any().optional()
      })
      .parse(await req.json())

    const activity = await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: params?.id ?? '',
        type: body.type,
        summary: body.summary,
        metadata: body.metadata ?? null,
        performedById: user.id
      }
    })

    return created(activity)
  }
})
