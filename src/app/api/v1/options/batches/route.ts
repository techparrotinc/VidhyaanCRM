import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ORG_ROLES } from '@/constants/roles'

// Batch dropdown feed for enquiry/lead/student forms (all org roles —
// counsellors and receptionists capture leads). Admin CRUD lives at
// /api/v1/settings/batches.

export const GET = route({
  roles: [...ORG_ROLES],
  handler: async ({ db }) => {
    const batches = await db.studentBatch.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        daysOfWeek: true,
        startTime: true,
        endTime: true,
        course: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    })
    return ok({ batches, empty: batches.length === 0 })
  }
})
