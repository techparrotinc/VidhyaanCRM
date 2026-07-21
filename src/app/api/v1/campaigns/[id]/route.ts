import { z } from 'zod'
import { Prisma, CampaignChannel, CampaignStatus } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
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
  heroImageUrl: z.string().url().max(500).optional().nullable(),
  emailBlocks: z.array(z.record(z.string(), z.any())).max(50).optional().nullable(),
  emailHtml: z.string().max(50000).optional().nullable(),
  abVariants: z.array(z.object({
    key: z.string().max(4),
    subject: z.string().max(200).optional().nullable(),
    templateBody: z.string().max(2000),
    heroImageUrl: z.string().url().max(500).optional().nullable(),
  })).min(2).max(4).optional().nullable(),
  abTestPercent: z.number().int().min(1).max(100).optional().nullable(),
  whatsappTemplateId: z.string().max(50).optional().nullable(),
  formTemplateId: z.string().optional().nullable(),
  paramValues: z.record(z.string().max(40), z.string().max(300)).optional().nullable(),
  scheduledAt: z.string().optional().nullable()
})

export const GET = route({
  module: 'campaign_management',
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Campaign')
    }

    const campaign = await db.campaign.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      },
      include: {
        recipients: {
          select: {
            id: true,
            recipientType: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            failureReason: true
          }
        },
        _count: {
          select: { recipients: true }
        }
      }
    })

    if (!campaign) {
      throw Errors.notFound('Campaign')
    }

    return ok(campaign)
  }
})

export const PUT = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Campaign')
    }

    const existing = await db.campaign.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!existing) {
      throw Errors.notFound('Campaign')
    }

    if (existing.status !== CampaignStatus.DRAFT) {
      throw Errors.businessRule('Only draft campaigns can be edited')
    }

    const data = campaignSchema.partial().parse(await req.json())

    // Validate the WhatsApp template FK when provided (org-owned + usable)
    if (data.whatsappTemplateId) {
      const tpl = await db.whatsappTemplate.findFirst({
        where: {
          id: data.whatsappTemplateId,
          orgId: user.orgId,
          deletedAt: null,
          status: { in: ['VERIFIED', 'SYNCED'] }
        },
        select: { id: true }
      })
      if (!tpl) {
        throw Errors.validation({
          whatsappTemplateId: ['Template not found or not verified yet']
        })
      }
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        name: data.name,
        channel: data.channel as CampaignChannel | undefined,
        audienceFilter: data.audienceFilter !== undefined ? (data.audienceFilter as Prisma.InputJsonValue) : undefined,
        templateBody: data.templateBody,
        heroImageUrl: data.heroImageUrl !== undefined ? data.heroImageUrl : undefined,
        emailBlocks: data.emailBlocks !== undefined ? ((data.emailBlocks as Prisma.InputJsonValue) ?? undefined) : undefined,
        emailHtml: data.emailHtml !== undefined ? data.emailHtml : undefined,
        abVariants: data.abVariants !== undefined ? ((data.abVariants as Prisma.InputJsonValue) ?? undefined) : undefined,
        abTestPercent: data.abTestPercent !== undefined ? data.abTestPercent : undefined,
        whatsappTemplateId: data.whatsappTemplateId !== undefined ? data.whatsappTemplateId : undefined,
        formTemplateId: data.formTemplateId !== undefined ? data.formTemplateId : undefined,
        paramValues: data.paramValues !== undefined ? (data.paramValues ?? undefined) : undefined,
        scheduledAt: data.scheduledAt !== undefined ? (data.scheduledAt ? new Date(data.scheduledAt) : null) : undefined
      }
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Campaign')
    }

    const existing = await db.campaign.findFirst({
      where: {
        id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!existing) {
      throw Errors.notFound('Campaign')
    }

    if (existing.status !== CampaignStatus.DRAFT && existing.status !== CampaignStatus.SCHEDULED) {
      throw Errors.businessRule('Only draft or scheduled campaigns can be deleted')
    }

    await db.campaign.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    return ok({ success: true })
  }
})
