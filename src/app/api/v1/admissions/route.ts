import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { redis } from '@/lib/redis'
import { AdmissionStatus, LeadPriority } from '@prisma/client'
import { asEnum } from '@/lib/api/query'
import { Errors } from '@/lib/api/errors'
import { Prisma } from '@prisma/client'
import { createLeadWithUniqueCode } from '@/lib/lead-code'
import { createNotification } from '@/lib/services/notifications'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25') || 25))
    const stageId = searchParams.get('stageId')
    const assignedToId = searchParams.get('assignedToId') ?? searchParams.get('counsellorId') ?? undefined
    const priority = searchParams.get('priority') ?? undefined
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    const skip = (page - 1) * limit

    const showArchived = searchParams.get('archived') === 'true'

    const where: any = {
      orgId: user.orgId,
      deletedAt: null,
      // Archived records live in a dedicated view; active lists exclude them
      archivedAt: showArchived ? { not: null } : null,
      ...(stageId && {
        stageId: stageId
      }),
      ...(search && {
        OR: [
          { applicantName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          { admissionCode: {
              contains: search,
              mode: 'insensitive'
            }
          },
          { phone: {
              contains: search,
              mode: 'insensitive'
            }
          },
        ]
      }),
      ...(assignedToId && {
        assignedToId
      }),
      ...(priority && {
        lead: {
          priority: asEnum(LeadPriority, priority, 'priority')
        }
      }),
      ...(dateFrom && {
        createdAt: { gte: new Date(dateFrom) }
      }),
      ...(status && { status: asEnum(AdmissionStatus, status, 'status') }),
      ...(academicYearId && {
        OR: [
          { academicYearId: academicYearId },
          { academicYearId: null }
        ]
      }),
    }

    const [admissions, total] = await Promise.all([
      db.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          admissionCode: true,
          applicantName: true,
          parentName: true,
          phone: true,
          email: true,
          gradeSought: true,
          status: true,
          stageId: true,
          createdAt: true,
          lead: {
            select: {
              priority: true
            }
          },
          stage: {
            select: {
              id: true,
              name: true,
              color: true,
              isWon: true,
              isLost: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          academicYear: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              activities: true,
              documents: true
            }
          }
        }
      }),
      db.admission.count({ where })
    ])

    const admissionsWithIsTerminal = admissions.map((adm: any) => ({
      ...adm,
      priority: adm.lead?.priority || 'MEDIUM',
      stage: adm.stage
        ? {
            ...adm.stage,
            isTerminal: adm.stage.isWon || adm.stage.isLost
          }
        : null
    }))

    const paginatedRes = paginated(admissionsWithIsTerminal, total, page, limit)
    const json = await paginatedRes.json()
    return NextResponse.json({
      ...json,
      admissions: json.data
    })
  }
})

const createAdmissionSchema = z.object({
  applicantName: z.string().min(1,
    'Applicant name is required'),
  parentName: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  phone: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  email: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
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
  stageId: z.string()
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
  priority: z.string()
    .optional()
    .default('MEDIUM'),
  notes: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
  leadId: z.string()
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
  currentSchool: z.string()
    .optional().nullable()
    .or(z.literal(''))
    .transform(v =>
      v === '' ? null : v
    ),
})

export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user, org, academicYearId }) => {
    const body = createAdmissionSchema.parse(await req.json())

    // Get first stage if not provided
    let stageId = body.stageId
    if (!stageId) {
      const firstStage = await db.admissionStage.findFirst({
        where: { isLost: false },
        orderBy: { sortOrder: 'asc' }
      })
      stageId = firstStage?.id
    }

    const year = new Date().getFullYear()

    let leadId = body.leadId
    if (leadId) {
      // Duplicate-convert guard: one lead → one admission
      const existingAdmission = await db.admission.findFirst({
        where: { leadId, deletedAt: null },
        select: { id: true, admissionCode: true }
      })
      if (existingAdmission) {
        throw Errors.conflict(
          `This lead is already converted (admission ${existingAdmission.admissionCode}).`
        )
      }
    }

    if (!leadId) {
      const newLead = await createLeadWithUniqueCode(user.orgId, (leadCode) =>
        db.lead.create({
          data: {
            orgId: user.orgId,
            branchId: null,
            academicYearId: body.academicYearId || academicYearId || null,
            leadCode,
            kidName: body.applicantName,
            parentName: body.parentName ?? "",
            phone: body.phone ?? "",
            email: body.email ?? null,
            status: 'CONVERTED',
            expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
            currentSchool: body.currentSchool ?? null,
            priority: (body.priority ?? 'MEDIUM') as any,
            gradeSought: body.gradeSought ?? null
          }
        })
      )
      leadId = newLead.id
    } else {
      await db.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
          expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
          currentSchool: body.currentSchool ?? null,
          priority: (body.priority ?? 'MEDIUM') as any
        }
      })

      // The lead timeline must show the conversion (the lead PUT handler
      // logs status changes; conversion previously logged nothing here)
      await db.leadActivity.create({
        data: {
          orgId: user.orgId,
          leadId,
          type: 'STATUS_CHANGE',
          summary: 'Lead converted to admission',
          performedById: user.id
        }
      }).catch(err => console.error('Lead conversion activity log failed:', err))

      // In-app/email alert for the assigned counsellor (not the converter)
      const convertedLead = await db.lead.findFirst({
        where: { id: leadId },
        select: { parentName: true, leadCode: true, assignedToId: true }
      })
      if (convertedLead?.assignedToId && convertedLead.assignedToId !== user.id) {
        createNotification({
          orgId: user.orgId,
          recipientType: 'USER',
          recipientId: convertedLead.assignedToId,
          type: 'LEAD_CONVERTED',
          title: 'Lead converted to admission',
          body: `${convertedLead.parentName} (${convertedLead.leadCode}) was converted to an admission by ${user.name || 'a teammate'}.`,
          data: { leadId }
        }).catch(err => console.error('Lead-converted notification failed:', err))
      }
    }

    // Create admission — the code derives from count()+1 against a unique
    // [orgId, admissionCode] constraint, so concurrent converts can collide;
    // retry with a re-count instead of surfacing a 500.
    const institutionType = 'SCHOOL'
    const prefix = institutionType === 'SCHOOL' ? 'AT' : 'EN'

    let admission
    for (let attempt = 0; ; attempt++) {
      const count = await prisma.admission.count({
        where: { orgId: user.orgId }
      })
      const admissionCode =
        prefix + '-' + year + '-' + String(count + 1 + attempt).padStart(5, '0')

      try {
        admission = await db.admission.create({
          data: {
            applicantName: body.applicantName,
            parentName: body.parentName ?? null,
            phone: body.phone ?? null,
            email: body.email ?? null,
            gradeSought: body.gradeSought ?? null,
            orgId: user.orgId,
            admissionCode,
            stageId: stageId ?? null,
            assignedToId: body.assignedToId ?? null,
            academicYearId: body.academicYearId ?? academicYearId ?? null,
            leadId,
            status: 'IN_PROGRESS'
          },
          include: {
            stage: true
          }
        })
        break
      } catch (err) {
        const isCodeCollision =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
        if (!isCodeCollision || attempt >= 2) throw err
      }
    }

    // Log activity
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: admission.id,
        type: 'SYSTEM',
        summary: body.notes ? `Admission created. Note: ${body.notes}` : 'Admission created',
        performedById: user.id
      }
    })

    // Invalidate pipeline cache
    try {
      const ayId = body.academicYearId || academicYearId
      await redis.del(`pipeline:${user.orgId}`)
      await redis.del(`admissions_pipeline:${user.orgId}:all`)
      if (ayId) {
        await redis.del(`admissions_pipeline:${user.orgId}:${ayId}`)
      }
    } catch (err) {
      console.error('Failed to invalidate pipeline cache:', err)
    }

    return created(admission)
  }
})
