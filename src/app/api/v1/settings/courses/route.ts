import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'

const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'MUSIC', 'DANCE', 'ART', 'ABACUS',
    'COACHING', 'SPORTS', 'LANGUAGE',
    'STEM', 'OTHER'
  ]).optional(),
  amount: z.number().min(0),
  frequency: z.enum([
    'ONE_TIME', 'WEEKLY', 'BI_MONTHLY', 'MONTHLY', 'QUARTERLY',
    'HALF_YEARLY', 'ANNUAL', 'CUSTOM'
  ]).default('MONTHLY'),
  billingDay: z.number().min(1).max(28).default(1),
  durationMonths: z.number().optional(),
  // Custom-schedule inputs (LC): weekly cadence + total package hours. Drive the
  // per-student schedule builder's default cadence and the session hours cap.
  hoursPerWeek: z.number().min(0).max(60).optional().nullable(),
  totalHours: z.number().min(0).max(2000).optional().nullable(),
  isActive: z.boolean().default(true)
})

export const GET = route({
  // Course master is catalogue data (lead/enquiry/enrolment dropdowns feed
  // from it) — role-gated, not module-gated, mirroring the class/batch
  // masters. Fee billing itself stays behind FEE_MANAGEMENT routes.
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user }) => {
    const courses = await db.course.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    })
    return ok(courses)
  }
})

export const POST = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user }) => {
    const body = courseSchema.parse(await req.json())
    const course = await db.course.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        description: body.description,
        category: body.category,
        amount: body.amount,
        frequency: body.frequency,
        billingDay: body.billingDay,
        durationMonths: body.durationMonths,
        hoursPerWeek: body.hoursPerWeek ?? null,
        totalHours: body.totalHours ?? null,
        isActive: body.isActive
      }
    })
    return created(course)
  }
})
