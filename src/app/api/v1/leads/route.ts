import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { LeadSource, LeadStatus, LeadPriority } from '@prisma/client'
import { createNotification } from '@/lib/services/notifications'
import { cleanPhoneNumber } from '@/lib/utils'
import { parseQuery, paginationShape, enumParam, textParam } from '@/lib/api/query'

export const GET = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, org }) => {
    const q = parseQuery(req.url, {
      ...paginationShape,
      status: enumParam(LeadStatus),
      source: enumParam(LeadSource),
      priority: enumParam(LeadPriority),
      counsellorId: textParam,
      assignedToId: textParam,
      search: textParam
    })
    const { page, limit, status, source, priority, search } = q
    const counsellorId = q.counsellorId ?? q.assignedToId

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (source) where.source = source
    if (priority) where.priority = priority
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

    // Lead-cap usage (totalLeadsInOrg) batched with the list + page count so
    // the free-plan banner costs no extra sequential round-trip.
    const [leads, total, totalLeadsInOrg] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          leadCode: true,
          parentName: true,
          phone: true,
          email: true,
          kidName: true,
          status: true,
          priority: true,
          source: true,
          gradeSought: true,
          nextFollowUpAt: true,
          createdAt: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
            }
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              activities: true,
            }
          }
        }
      }),
      db.lead.count({ where }),
      db.lead.count()
    ])

    const paginatedRes = paginated(leads, total, page, limit)
    const json = await paginatedRes.json()

    return NextResponse.json({
      ...json,
      leads: json.data,
      leadCap: {
        cap: org.leadCap,
        used: totalLeadsInOrg
      }
    })
  }
})

const createLeadSchema = z.object({
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

    const parentName = body.parentName

    // 1. Check lead cap
    const leadCount = await prisma.lead.count({
      where: { orgId: user.orgId }
    })

    if (org.leadCap !== null && leadCount >= org.leadCap) {
      const leadCode = await generateLeadCode(user.orgId)
      const lead = await db.lead.create({
        data: {
          parentName: body.parentName,
          phone: body.phone,
          email: body.email || null,
          kidName: body.kidName || null,
          childAge: body.childAge || null,
          currentSchool: body.currentSchool || null,
          source: (body.source || 'WALK_IN') as LeadSource,
          priority: (body.priority || 'MEDIUM') as LeadPriority,
          status: 'NEW',
          gradeSought: body.gradeSought || null,
          leadCode,
          orgId: user.orgId,
          academicYearId: body.academicYearId || null,
          nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
          expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
        }
      })

      return ok({
        ...lead,
        queued: true,
        message: 'Lead cap reached. Lead saved to queue. Upgrade to access queued leads.'
      }, undefined, 201)
    }

    // 2. Check for duplicate
    const duplicate = await prisma.lead.findFirst({
      where: {
        phone: body.phone,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    // 3. Resolve assignedToId safely
    let finalAssignedToId: string | null = null

    if (body.assignedToId) {
      const validUser = await prisma.user.findFirst({
        where: {
          id: body.assignedToId,
          orgId: user.orgId,
          status: 'ACTIVE',
        },
        select: { id: true }
      })
      finalAssignedToId = validUser?.id || null
    }

    if (!finalAssignedToId) {
      const counsellors = await prisma.user.findMany({
        where: {
          orgId: user.orgId,
          roleAssignments: {
            some: {
              role: {
                in: ['COUNSELLOR', 'ORG_ADMIN', 'BRANCH_ADMIN']
              },
              status: 'ACTIVE'
            }
          },
          status: 'ACTIVE',
          deletedAt: null
        },
        select: { id: true }
      })

      if (counsellors.length > 0) {
        const totalLeads = await prisma.lead.count({
          where: { orgId: user.orgId }
        })
        const index = totalLeads % counsellors.length
        finalAssignedToId = counsellors[index].id
      }
    }

    // 4. Generate lead code
    const leadCode = await generateLeadCode(user.orgId)

    // 5. Create lead
    const lead = await db.lead.create({
      data: {
        parentName: body.parentName,
        phone: body.phone,
        email: body.email || null,
        kidName: body.kidName || null,
        childAge: body.childAge || null,
        currentSchool: body.currentSchool || null,
        source: (body.source || 'WALK_IN') as LeadSource,
        priority: (body.priority || 'MEDIUM') as LeadPriority,
        status: 'NEW',
        gradeSought: body.gradeSought || null,
        leadCode,
        orgId: user.orgId,
        academicYearId: body.academicYearId || null,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
        expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
        ...(finalAssignedToId && {
          assignedToId: finalAssignedToId
        }),
      }
    })

    // 6. Create activity log
    await db.leadActivity.create({
      data: {
        orgId: user.orgId,
        leadId: lead.id,
        type: 'SYSTEM',
        summary: body.notes ? `Lead created from ${body.source}. Note: ${body.notes}` : `Lead created from ${body.source}`,
        performedById: user.id
      }
    })

    // 7. Create in-app notification for the assigned counsellor
    if (finalAssignedToId) {
      try {
        await createNotification({
          orgId: user.orgId,
          recipientType: 'USER',
          recipientId: finalAssignedToId,
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

