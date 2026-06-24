import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES, CRM_ROLES } from '@/constants/roles'
import { LeadSource, LeadStatus, LeadPriority } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'

export const GET = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [...CRM_ROLES],
  handler: async ({ req, db, params }) => {
    const lead = await db.lead.findFirst({
      where: { id: params?.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!lead) throw Errors.notFound('Lead')
    return ok(lead)
  }
})

const updateLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.preprocess(cleanPhoneNumber, z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional()),
  email: z.string().email().optional().nullable(),
  source: z.nativeEnum(LeadSource).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  gradeSought: z.string().optional().nullable(),
  kidName: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  academicYearId: z.string().optional().nullable()
})

export const PUT = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR
  ],
  handler: async ({ req, db, user, params }) => {
    const existing = await db.lead.findFirst({
      where: { id: params?.id }
    })
    if (!existing) throw Errors.notFound('Lead')

    const body = updateLeadSchema.parse(await req.json())

    const updateData: any = {}
    if (body.phone) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.source) updateData.source = body.source
    if (body.status) updateData.status = body.status
    if (body.priority) updateData.priority = body.priority
    if (body.gradeSought !== undefined) updateData.gradeSought = body.gradeSought
    if (body.kidName !== undefined) updateData.kidName = body.kidName
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId
    if (body.academicYearId !== undefined) updateData.academicYearId = body.academicYearId
    if (body.nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null
    }

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const parts = existing.parentName.split(' ')
      const currentFirstName = body.firstName ?? parts[0]
      const currentLastName = body.lastName ?? parts.slice(1).join(' ')
      updateData.parentName = currentLastName ? `${currentFirstName} ${currentLastName}` : currentFirstName
    }

    const updated = await db.lead.update({
      where: { id: params?.id },
      data: updateData
    })

    // Track first contact
    if (body.status === 'CONTACTED' && !existing.firstContactedAt) {
      await db.lead.update({
        where: { id: params?.id },
        data: {
          firstContactedAt: new Date()
        }
      })
    }

    // Log activity for status change
    if (body.status && body.status !== existing.status) {
      await db.leadActivity.create({
        data: {
          orgId: user.orgId,
          leadId: existing.id,
          type: 'STATUS_CHANGE',
          summary: 'Status changed from ' + existing.status + ' to ' + body.status,
          performedById: user.id
        }
      })
    }

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db, params, user }) => {
    const existing = await db.lead.findFirst({
      where: { id: params?.id }
    })
    if (!existing) throw Errors.notFound('Lead')

    await db.lead.update({
      where: { id: params?.id },
      data: { deletedAt: new Date() }
    })

    return ok({ deleted: true })
  }
})
