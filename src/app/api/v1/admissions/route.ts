import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
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
    const stageId = searchParams.get('stageId') ?? undefined
    const counsellorId = searchParams.get('counsellorId') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    const skip = (page - 1) * limit

    const where: any = {
      deletedAt: null
    }
    if (stageId) where.stageId = stageId
    if (counsellorId) {
      where.assignedToId = counsellorId
    }
    if (academicYearId) {
      where.academicYearId = academicYearId
    }
    if (search) {
      where.OR = [
        {
          applicantName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        { phone: { contains: search } },
        {
          admissionCode: {
            contains: search
          }
        }
      ]
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
          createdAt: true,
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
            select: { documents: true }
          }
        }
      }),
      db.admission.count({ where })
    ])

    const admissionsWithIsTerminal = admissions.map((adm: any) => ({
      ...adm,
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

    // Generate admission code
    const year = new Date().getFullYear()
    const count = await prisma.admission.count({
      where: { orgId: user.orgId }
    })

    const institutionType = 'SCHOOL'
    const prefix = institutionType === 'SCHOOL' ? 'AT' : 'EN'

    const admissionCode =
      prefix + '-' + year + '-' + String(count + 1).padStart(5, '0')

    // Create admission
    const admission = await db.admission.create({
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
        leadId: body.leadId ?? null,
        status: 'IN_PROGRESS'
      },
      include: {
        stage: true
      }
    })

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

    // If created from lead update lead
    if (body.leadId) {
      await db.lead.update({
        where: { id: body.leadId },
        data: { status: 'CONVERTED' }
      })
    }

    return created(admission)
  }
})
