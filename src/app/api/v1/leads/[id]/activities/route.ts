import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { CRM_ROLES } from '@/constants/roles'
import { ActivityType } from '@prisma/client'

export const POST = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [...CRM_ROLES],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const leadId = resolvedParams?.id
    if (!leadId) throw Errors.notFound('Lead')

    const lead = await db.lead.findFirst({
      where: { id: leadId, deletedAt: null },
      select: { id: true }
    })
    if (!lead) throw Errors.notFound('Lead')

    const body = z.object({
      type: z.nativeEnum(ActivityType),
      summary: z.string().min(1),
      metadata: z.any().optional()
    }).parse(await req.json())

    const activity = await db.leadActivity.create({
      data: {
        orgId: user.orgId,
        leadId,
        type: body.type,
        summary: body.summary,
        metadata: body.metadata,
        performedById: user.id
      }
    })

    return created(activity)
  }
})
