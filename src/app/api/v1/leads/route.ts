import { NextRequest } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { LeadSource, LeadStatus, LeadPriority } from '@prisma/client'
import { createNotification } from '@/lib/services/notifications'
import { cleanPhoneNumber } from '@/lib/utils'

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
  phone: z.preprocess(cleanPhoneNumber, z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')),

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

    const parentName = body.lastName ? `${body.firstName} ${body.lastName}` : body.firstName

    // 1. Check lead cap
    const leadCount = await prisma.lead.count({
      where: { orgId: user.orgId }
    })

    if (org.leadCap !== null && leadCount >= org.leadCap) {
      const leadCode = await generateLeadCode(user.orgId)
      const lead = await db.lead.create({
        data: {
          parentName,
          phone: body.phone,
          email: body.email ?? null,
          source: body.source ?? 'WALK_IN',
          status: 'NEW',
          priority: body.priority ?? 'MEDIUM',
          gradeSought: body.gradeSought ?? null,
          kidName: body.kidName ?? null,
          leadCode,
          orgId: user.orgId,
          academicYearId: body.academicYearId ?? academicYearId ?? null
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
    const cleanedAssignedToId = body.assignedToId && body.assignedToId.trim() !== '' ? body.assignedToId : null

    if (cleanedAssignedToId) {
      const verifyUser = await prisma.user.findFirst({
        where: {
          id: cleanedAssignedToId,
          orgId: user.orgId,
          status: 'ACTIVE',
          deletedAt: null
        }
      })
      if (verifyUser) {
        finalAssignedToId = cleanedAssignedToId
      }
    }

    if (!finalAssignedToId) {
      const counsellors = await prisma.user.findMany({
        where: {
          orgId: user.orgId,
          role: {
            in: ['COUNSELLOR', 'ORG_ADMIN', 'BRANCH_ADMIN']
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
    const data: any = {
      parentName,
      phone: body.phone,
      email: body.email ?? null,
      source: body.source ?? 'WALK_IN',
      status: body.status ?? 'NEW',
      priority: body.priority ?? 'MEDIUM',
      gradeSought: body.gradeSought ?? null,
      kidName: body.kidName ?? null,
      leadCode,
      orgId: user.orgId,
      academicYearId: body.academicYearId ?? academicYearId ?? null,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
    }

    if (finalAssignedToId) {
      data.assignedToId = finalAssignedToId
    }

    const lead = await db.lead.create({
      data
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

