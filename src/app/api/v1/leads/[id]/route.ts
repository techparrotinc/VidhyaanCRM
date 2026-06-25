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
  parentName: z.string().min(2,
    'Name is required'),
  phone: z.string().min(10).max(10),
  email: z.string().email()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  kidName: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  childAge: z.union([
    z.number(),
    z.string().transform(v =>
      v === '' ? null
      : parseInt(v) || null
    )
  ]).optional().nullable(),
  currentSchool: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  expectedJoinDate: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  source: z.string()
    .default('WALK_IN'),
  priority: z.string()
    .default('MEDIUM'),
  status: z.string()
    .default('NEW'),
  gradeSought: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  academicYearId: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  assignedToId: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  notes: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
  nextFollowUpAt: z.string()
    .optional().nullable()
    .or(z.literal('')).transform(
      v => v === '' ? null : v
    ),
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

    let finalAssignedToId: string | null = null

    if (body.assignedToId) {
      const validUser = await db.user.findFirst({
        where: {
          id: body.assignedToId,
          orgId: user.orgId,
          status: 'ACTIVE',
        },
        select: { id: true }
      })
      finalAssignedToId = validUser?.id || null
    }

    const updated = await db.lead.update({
      where: { id: params?.id },
      data: {
        parentName: body.parentName,
        phone: body.phone,
        email: body.email || null,
        kidName: body.kidName || null,
        childAge: body.childAge || null,
        currentSchool: body.currentSchool || null,
        source: (body.source || 'WALK_IN') as LeadSource,
        priority: (body.priority || 'MEDIUM') as LeadPriority,
        status: body.status as LeadStatus,
        gradeSought: body.gradeSought || null,
        academicYearId: body.academicYearId || null,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
        expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
        assignedToId: finalAssignedToId,
      }
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
