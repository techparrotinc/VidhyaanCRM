import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

// StudentBatch CRUD for LC/coaching orgs (batch = recurring cohort with an
// optional linked course + weekly schedule). Structural settings — role-gated.

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const batchInclude = {
  course: { select: { id: true, name: true } },
  _count: { select: { students: true } }
} as const

export const GET = route({
  roles: ADMIN_ROLES,
  handler: async ({ db }) => {
    const batches = await db.studentBatch.findMany({
      where: { deletedAt: null },
      include: batchInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
    })
    return ok({ batches })
  }
})

const batchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  courseId: z.string().nullable().optional(),
  daysOfWeek: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).max(7).default([]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  capacity: z.number().int().min(1).max(10000).nullable().optional(),
  isActive: z.boolean().default(true)
})

export const POST = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user, academicYearId }) => {
    const body = batchSchema.parse(await req.json())

    if (body.courseId) {
      const course = await db.course.findUnique({ where: { id: body.courseId } })
      if (!course) throw Errors.notFound('Course')
    }

    const batch = await db.studentBatch.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        courseId: body.courseId ?? null,
        daysOfWeek: body.daysOfWeek,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        capacity: body.capacity ?? null,
        isActive: body.isActive,
        academicYearId
      },
      include: batchInclude
    })
    return created({ batch })
  }
})
