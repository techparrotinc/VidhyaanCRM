import { z } from 'zod'
import { Prisma, CampaignChannel, CampaignStatus } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'

const campaignSchema = z.object({
  name: z.string().min(1).max(150),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  audienceFilter: z.object({
    pool: z.enum(['LEADS', 'STUDENTS', 'BOTH']),
    filters: z.array(
      z.object({
        field: z.string(),
        value: z.string()
      })
    ).optional()
  }).optional().nullable(),
  templateBody: z.string().max(2000).optional().nullable(),
  scheduledAt: z.string().optional().nullable()
})

export const GET = route({
  module: 'campaign_management',
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const q = searchParams.get('q')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    const skip = (page - 1) * limit

    const where: Prisma.CampaignWhereInput = {
      orgId: user.orgId,
      deletedAt: null
    }

    if (status) {
      where.status = status as CampaignStatus
    }
    if (channel) {
      where.channel = channel as CampaignChannel
    }
    if (q) {
      where.name = {
        contains: q,
        mode: 'insensitive'
      }
    }
    if (from || to) {
      const fromDate = from ? new Date(from) : undefined
      const toDate = to ? new Date(to) : undefined
      
      const dateFilters: Prisma.CampaignWhereInput[] = []
      if (fromDate) {
        dateFilters.push({
          OR: [
            { sentAt: { gte: fromDate } },
            { scheduledAt: { gte: fromDate } }
          ]
        })
      }
      if (toDate) {
        dateFilters.push({
          OR: [
            { sentAt: { lte: toDate } },
            { scheduledAt: { lte: toDate } }
          ]
        })
      }
      if (dateFilters.length > 0) {
        where.AND = dateFilters
      }
    }

    const [total, campaigns] = await Promise.all([
      db.campaign.count({ where }),
      db.campaign.findMany({
        where,
        include: {
          _count: {
            select: { recipients: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })
    ])

    return paginated(campaigns, total, page, limit)
  }
})

export const POST = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user }) => {
    const data = campaignSchema.parse(await req.json())

    const campaign = await db.campaign.create({
      data: {
        orgId: user.orgId,
        name: data.name,
        channel: data.channel as CampaignChannel,
        status: CampaignStatus.DRAFT,
        audienceFilter: data.audienceFilter as Prisma.InputJsonValue,
        templateBody: data.templateBody,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: user.id
      }
    })

    return created(campaign)
  }
})
