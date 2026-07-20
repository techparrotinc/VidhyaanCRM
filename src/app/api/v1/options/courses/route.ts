import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ORG_ROLES } from '@/constants/roles'

// Course dropdown feed for enrolment/student forms (all org roles — the
// admin-gated CRUD lives at /api/v1/settings/courses). Includes pricing so
// quick-enroll can show a fee summary before saving.

export const GET = route({
  roles: [...ORG_ROLES],
  handler: async ({ db }) => {
    const courses = await db.course.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        amount: true,
        frequency: true,
        billingDay: true,
        durationMonths: true,
        hoursPerWeek: true,
        totalHours: true
      },
      orderBy: { name: 'asc' }
    })
    return ok({ courses, empty: courses.length === 0 })
  }
})
