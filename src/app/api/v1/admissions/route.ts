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
import { createLeadWithUniqueCode } from '@/lib/lead-code'
import { createAdmissionWithUniqueCode } from '@/lib/admission-code'
import { createNotification } from '@/lib/services/notifications'
import { findMatches, loadDedupConfig, dedupFields } from '@/lib/dedup'
import { assertNotDuplicate } from '@/lib/dedup/guard'
import { checkEmailDeliverable } from '@/lib/email/validate'

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
  email: z.string().email()
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
  // "Create anyway" override for soft dedup matches
  force: z.boolean().optional(),
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

    // Deliverability gate — bad addresses here become bounces later.
    if (body.email) {
      const emailCheck = await checkEmailDeliverable(body.email)
      if (!emailCheck.ok) throw Errors.businessRule(emailCheck.message)
    }

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
    const resolvedYear = body.academicYearId || academicYearId || null

    // Dedup + household identity. Run the scan for context in both paths;
    // only *block* on a direct create (converting an existing lead is legit).
    const dedupConfig = await loadDedupConfig(db, user.orgId)
    const dedup = await findMatches(db, {
      orgId: user.orgId,
      phone: body.phone,
      email: body.email,
      childName: body.applicantName,
      grade: body.gradeSought,
      academicYearId: resolvedYear,
    }, dedupConfig)
    const identity = await dedupFields(db, {
      orgId: user.orgId, phone: body.phone, name: body.parentName, email: body.email,
    })

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
      // Block hard / unconfirmed-soft duplicates on direct entry.
      assertNotDuplicate(dedup, { force: body.force })

      // Don't spawn a duplicate lead: if this person already has a lead, reuse
      // it instead of minting a fresh one for every admission.
      const leadMatch = dedup.matches.find(m => m.type === 'lead')
      if (leadMatch) {
        leadId = leadMatch.id
        await db.lead.update({
          where: { id: leadId },
          data: {
            status: 'CONVERTED',
            householdId: identity.householdId ?? undefined,
            phoneNormalized: identity.phoneNormalized ?? undefined,
          },
        })
        await db.leadActivity.create({
          data: {
            orgId: user.orgId, leadId, type: 'STATUS_CHANGE',
            summary: 'Lead converted to admission (matched existing lead)',
            performedById: user.id,
          },
        }).catch(err => console.error('Lead conversion activity log failed:', err))
      } else {
        const newLead = await createLeadWithUniqueCode(user.orgId, (leadCode) =>
          db.lead.create({
            data: {
              orgId: user.orgId,
              branchId: null,
              academicYearId: resolvedYear,
              leadCode,
              kidName: body.applicantName,
              parentName: body.parentName ?? "",
              phone: body.phone ?? "",
              email: body.email ?? null,
              phoneNormalized: identity.phoneNormalized,
              householdId: identity.householdId,
              status: 'CONVERTED',
              expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
              currentSchool: body.currentSchool ?? null,
              priority: (body.priority ?? 'MEDIUM') as any,
              gradeSought: body.gradeSought ?? null
            }
          })
        )
        leadId = newLead.id
      }
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

    // Admission code from the numeric max (never count()+1 — soft-deleted rows
    // keep their code under the unique constraint). Prefix kept as 'AT-YYYY-'.
    const prefix = `AT-${year}-`
    const admission = await createAdmissionWithUniqueCode(user.orgId, prefix, (admissionCode) =>
      db.admission.create({
        data: {
          applicantName: body.applicantName,
          parentName: body.parentName ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          gradeSought: body.gradeSought ?? null,
          orgId: user.orgId,
          admissionCode,
          phoneNormalized: identity.phoneNormalized,
          householdId: identity.householdId,
          stageId: stageId ?? null,
          assignedToId: body.assignedToId ?? null,
          academicYearId: resolvedYear,
          leadId,
          status: 'IN_PROGRESS'
        },
        include: {
          stage: true
        }
      })
    )

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

    return created({
      ...admission,
      dedup: dedup.matches.length > 0 ? { action: dedup.action, matches: dedup.matches } : null
    })
  }
})
