import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
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
  // Custom-schedule inputs (LC) — see POST /settings/courses.
  hoursPerWeek: z.number().min(0).max(60).optional().nullable(),
  totalHours: z.number().min(0).max(2000).optional().nullable(),
  isActive: z.boolean().default(true)
})

export const PUT = route({
  // Course master is catalogue data (lead/enquiry/enrolment dropdowns feed
  // from it) — role-gated, not module-gated, mirroring the class/batch
  // masters. Fee billing itself stays behind FEE_MANAGEMENT routes.
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Course')
    }
    const body = courseSchema.partial().parse(await req.json())

    const existing = await db.course.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Course')
    }

    const updated = await db.course.update({
      where: { id },
      data: body
    })
    return ok(updated)
  }
})

export const DELETE = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Course')
    }

    const existing = await db.course.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Course')
    }

    await db.course.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    return ok({ success: true })
  }
})
