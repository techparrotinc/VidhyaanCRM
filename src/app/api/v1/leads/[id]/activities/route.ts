import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { CRM_ROLES } from '@/constants/roles'
import { ActivityType } from '@prisma/client'

export const POST = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [...CRM_ROLES],
  handler: async ({ req, db, user, params }) => {
    const body = z.object({
      type: z.nativeEnum(ActivityType),
      summary: z.string().min(1),
      metadata: z.any().optional()
    }).parse(await req.json())

    const activity = await db.leadActivity.create({
      data: {
        orgId: user.orgId,
        leadId: params?.id ?? '',
        type: body.type,
        summary: body.summary,
        metadata: body.metadata,
        performedById: user.id
      }
    })

    return created(activity)
  }
})
