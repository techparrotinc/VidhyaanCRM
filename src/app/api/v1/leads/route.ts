import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { LeadSource, LeadStatus, LeadPriority } from '@prisma/client'
import { createNotification } from '@/lib/services/notifications'

export const GET = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)
    const status = searchParams.get('status') ?? undefined
    const source = searchParams.get('source') ?? undefined
    const counsellorId = searchParams.get('counsellorId') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const priority = searchParams.get('priority') ?? undefined

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status as LeadStatus
    if (source) where.source = source as LeadSource
    if (priority) where.priority = priority as LeadPriority
    if (counsellorId) {
      where.assignedToId = counsellorId
    }
    if (search) {
      where.OR = [
        { parentName: { contains: search, mode: 'insensitive' } },
        { kidName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { leadCode: { contains: search } }
      ]
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { activities: true }
          }
        }
      }),
      db.lead.count({ where })
    ])

    return paginated(leads, total, page, limit)
  }
})

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email().optional().nullable(),
  source: z.nativeEnum(LeadSource).default(LeadSource.WALK_IN),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  priority: z.nativeEnum(LeadPriority).default(LeadPriority.MEDIUM),
  gradeSought: z.string().optional().nullable(),
  kidName: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  academicYearId: z.string().optional().nullable()
})

export const POST = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user, org, academicYearId }) => {
    const body = createLeadSchema.parse(await req.json())

    // Check lead cap for free plan
    const leadCount = await db.lead.count()

    // Map body to DB fields
    const { firstName, lastName, nextFollowUpAt, notes, ...bodyRest } = body
    const parentName = lastName ? `${firstName} ${lastName}` : firstName

    if (org.leadCap !== null && leadCount >= org.leadCap) {
      // Create lead in "JUNK" state or default since metadata/queued field doesn't exist
      const lead = await db.lead.create({
        data: {
          ...bodyRest,
          orgId: user.orgId,
          parentName,
          leadCode: await generateLeadCode(user.orgId),
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
          academicYearId: body.academicYearId ?? academicYearId ?? null
        }
      })

      return ok({
        ...lead,
        queued: true,
        message: 'Lead cap reached. Lead saved to queue. Upgrade to access queued leads.'
      }, undefined, 201)
    }

    // Check for duplicate
    const duplicate = await db.lead.findFirst({
      where: { phone: body.phone }
    })

    // Auto-assign counsellor if not provided
    let assignedToId = body.assignedToId
    if (!assignedToId) {
      const counsellors = await prisma.user.findMany({
        where: {
          orgId: user.orgId,
          role: 'COUNSELLOR',
          status: 'ACTIVE'
        },
        select: { id: true }
      })

      if (counsellors.length > 0) {
        const count = await prisma.lead.count({
          where: { orgId: user.orgId }
        })
        assignedToId = counsellors[count % counsellors.length].id
      }
    }

    // Generate lead code
    const leadCode = await generateLeadCode(user.orgId)

    // Create lead
    const lead = await db.lead.create({
      data: {
        ...bodyRest,
        orgId: user.orgId,
        parentName,
        leadCode,
        assignedToId,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        academicYearId: body.academicYearId ?? academicYearId ?? null
      }
    })

    // Create activity log, incorporating notes if present
    await db.leadActivity.create({
      data: {
        orgId: user.orgId,
        leadId: lead.id,
        type: 'SYSTEM',
        summary: notes ? `Lead created from ${body.source}. Note: ${notes}` : `Lead created from ${body.source}`,
        performedById: user.id
      }
    })

    // Create in-app notification for the assigned counsellor
    if (assignedToId) {
      try {
        await createNotification({
          orgId: user.orgId,
          recipientType: 'USER',
          recipientId: assignedToId,
          type: 'LEAD_RECEIVED',
          title: 'New Lead Received',
          body: `${parentName} enquired about ${body.gradeSought || 'N/A'}`,
          data: {
            leadId: lead.id,
            href: `/lead-management/${lead.id}`
          }
        })
      } catch (e) {
        console.error('Failed to trigger lead notification:', e)
      }
    }

    return created({
      ...lead,
      isDuplicate: !!duplicate,
      duplicateOf: duplicate ?? null
    })
  }
})

async function generateLeadCode(orgId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.lead.count({
    where: { orgId }
  })
  return 'LD-' + year + '-' + String(count + 1).padStart(5, '0')
}
