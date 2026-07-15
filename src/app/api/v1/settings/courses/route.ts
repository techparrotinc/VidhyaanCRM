import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
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
  isActive: z.boolean().default(true)
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
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
  module: MODULES.FEE_MANAGEMENT,
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
        isActive: body.isActive
      }
    })
    return created(course)
  }
})
