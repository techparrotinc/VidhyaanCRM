import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES, CRM_ROLES } from '@/constants/roles'
import { rolesFor } from '@/constants/permissions'
import { logAudit, auditSnapshot } from '@/lib/audit/log'
import { LeadSource, LeadStatus, LeadPriority, AuditAction } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'
import { dedupFields } from '@/lib/dedup'
import { prisma } from '@/lib/db'
import { onLeadAssigned, onLeadClosed } from '@/lib/whatsapp/emitters'
import { isOverLeadCap } from '@/lib/billing/plan-status'

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
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'])
    .optional(),
  gradeSought: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  course: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  batch: z.string()
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
  handler: async ({ req, db, user, org, params }) => {
    const existing = await db.lead.findFirst({
      where: { id: params?.id }
    })
    if (!existing) throw Errors.notFound('Lead')

    const body = updateLeadSchema.parse(await req.json())

    // Queued (created past the free-tier leadCap) leads can be managed
    // freely otherwise, but converting one is the actual value being gated —
    // re-checked live (org may have upgraded since), not the stale flag alone.
    if (body.status === 'CONVERTED' && existing.queued) {
      const orgPlan = await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { status: true, plan: { select: { slug: true, monthlyPrice: true } } }
      })
      if (await isOverLeadCap(db, user.orgId, { ...orgPlan, leadCap: org.leadCap })) {
        throw Errors.forbidden('This lead is queued past your plan\'s lead limit. Upgrade to convert it.')
      }
    }

    const updateData: any = {}

    if (body.parentName !== undefined)
      updateData.parentName = body.parentName

    if (body.phone !== undefined) {
      updateData.phone = body.phone
      // Keep the dedup join key + household in sync when the phone changes.
      const identity = await dedupFields(db, {
        orgId: user.orgId,
        phone: body.phone,
        name: body.parentName ?? existing.parentName,
        email: body.email ?? existing.email,
      })
      updateData.phoneNormalized = identity.phoneNormalized
      // Write household via the relation, not the scalar FK: this payload also
      // uses relation writes (academicYear/assignedTo), which forces Prisma's
      // checked update input where the scalar `householdId` is rejected.
      updateData.household = identity.householdId
        ? { connect: { id: identity.householdId } }
        : { disconnect: true }
    }

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

    if (body.course !== undefined)
      updateData.course = body.course || null

    if (body.batch !== undefined)
      updateData.batch = body.batch || null

    if (body.academicYearId !== undefined) {
      updateData.academicYear = body.academicYearId
        ? { connect: { id: body.academicYearId } }
        : { disconnect: true }
    }


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
        if (validUser) {
          updateData.assignedTo = { connect: { id: validUser.id } }
        } else {
          updateData.assignedTo = { disconnect: true }
        }
      } else {
        updateData.assignedTo = { disconnect: true }
      }
    }

    const updated = await db.lead.update({
      where: { id: params?.id },
      data: updateData
    })

    logAudit({
      orgId: user.orgId,
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'LEAD',
      entityId: updated.id,
      before: auditSnapshot(existing, ['parentName', 'phone', 'email', 'status', 'priority', 'assignedToId', 'gradeSought']),
      after: auditSnapshot(updated, ['parentName', 'phone', 'email', 'status', 'priority', 'assignedToId', 'gradeSought']),
      req,
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

    // Log note if provided
    if (body.notes) {
      await db.leadActivity.create({
        data: {
          orgId: user.orgId,
          leadId: existing.id,
          type: 'NOTE',
          summary: body.notes,
          performedById: user.id
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

    // WhatsApp workflow notifications (fire-and-forget; template adoption
    // per org is the switch)
    if (
      body.assignedToId &&
      updated.assignedToId &&
      updated.assignedToId !== existing.assignedToId
    ) {
      prisma.user
        .findUnique({ where: { id: updated.assignedToId }, select: { id: true, name: true, phone: true } })
        .then(c => c && onLeadAssigned(user.orgId, updated, c))
        .catch(() => {})
    }
    if (body.status === 'NOT_INTERESTED' && existing.status !== 'NOT_INTERESTED') {
      onLeadClosed(user.orgId, updated).catch(() => {})
    }

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: rolesFor('LEAD', 'delete'),
  handler: async ({ req, db, params, user }) => {
    const existing = await db.lead.findFirst({
      where: { id: params?.id }
    })
    if (!existing) throw Errors.notFound('Lead')

    await db.lead.update({
      where: { id: params?.id },
      data: { deletedAt: new Date() }
    })

    logAudit({
      orgId: user.orgId,
      userId: user.id,
      action: AuditAction.DELETE,
      entityType: 'LEAD',
      entityId: existing.id,
      before: auditSnapshot(existing, ['leadCode', 'parentName', 'phone', 'kidName', 'status', 'assignedToId']),
      req,
    })

    return ok({ deleted: true })
  }
})
