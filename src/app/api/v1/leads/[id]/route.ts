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
    const id = params?.id
    const lead = await db.lead.findFirst({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!lead) throw Errors.notFound('Lead')

    const [activities, related] = await Promise.all([
      db.leadActivity.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      lead.phone ? db.lead.findMany({
        where: {
          phone: lead.phone,
          id: { not: id }
        },
        take: 3
      }) : Promise.resolve([])
    ])

    return ok({
      ...lead,
      activities,
      related
    })
  }
})

const updateLeadSchema = z.object({
  parentName: z.string().min(2)
    .optional(),
  phone: z.string().min(10).max(10)
    .optional(),
  email: z.string().email()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  kidName: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  childAge: z.union([
    z.number().optional().nullable(),
    z.string().transform(v =>
      !v || v === ''
        ? null
        : parseInt(v) || null
    )
  ]).optional().nullable(),
  currentSchool: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  expectedJoinDate: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  source: z.string()
    .optional(),
  priority: z.string()
    .optional(),
  status: z.string()
    .optional(),
  gradeSought: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  academicYearId: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  assignedToId: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  notes: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  nextFollowUpAt: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  lostReason: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
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

    const updateData: any = {}

    if (body.parentName !== undefined)
      updateData.parentName = body.parentName

    if (body.phone !== undefined)
      updateData.phone = body.phone

    if (body.email !== undefined)
      updateData.email = body.email || null

    if (body.kidName !== undefined)
      updateData.kidName = body.kidName || null

    if (body.childAge !== undefined)
      updateData.childAge = body.childAge || null

    if (body.currentSchool !== undefined)
      updateData.currentSchool = body.currentSchool || null

    if (body.source !== undefined)
      updateData.source = body.source as LeadSource

    if (body.priority !== undefined)
      updateData.priority = body.priority as LeadPriority

    if (body.status !== undefined)
      updateData.status = body.status as LeadStatus

    if (body.gradeSought !== undefined)
      updateData.gradeSought = body.gradeSought || null

    if (body.academicYearId !== undefined)
      updateData.academicYearId = body.academicYearId || null

    if (body.notes !== undefined)
      updateData.notes = body.notes || null

    if (body.nextFollowUpAt !== undefined)
      updateData.nextFollowUpAt = body.nextFollowUpAt
        ? new Date(body.nextFollowUpAt)
        : null

    if (body.expectedJoinDate !== undefined)
      updateData.expectedJoinDate = body.expectedJoinDate
        ? new Date(body.expectedJoinDate)
        : null

    if (body.lostReason !== undefined)
      updateData.lostReason = body.lostReason || null

    if (body.assignedToId !== undefined) {
      if (body.assignedToId) {
        const validUser = await db.user.findFirst({
          where: {
            id: body.assignedToId,
            orgId: user.orgId,
            status: 'ACTIVE',
          },
          select: { id: true }
        })
        updateData.assignedToId = validUser?.id || null
      } else {
        updateData.assignedToId = null
      }
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
