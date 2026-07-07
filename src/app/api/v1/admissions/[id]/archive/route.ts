import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'

const archiveSchema = z.object({
  archived: z.boolean()
})

/**
 * Archive / unarchive an admission. Admitted records cannot be deleted
 * (they anchor student records and reporting) — archiving hides them from
 * active list, kanban and pipeline views while keeping history intact.
 */
export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, params, user }) => {
    const { id } = (await params) as any
    const body = archiveSchema.parse(await req.json())

    const admission = await db.admission.findFirst({
      where: { id, deletedAt: null }
    })
    if (!admission) {
      throw Errors.notFound('Admission')
    }

    const updated = await db.admission.update({
      where: { id },
      data: { archivedAt: body.archived ? new Date() : null }
    })

    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: id,
        type: 'SYSTEM',
        summary: body.archived ? 'Admission archived' : 'Admission unarchived',
        performedById: user.id
      }
    })

    // Invalidate pipeline cache (all + per-academic-year variants)
    try {
      await redis.del(`admissions_pipeline:${user.orgId}:all`)
      if (admission.academicYearId) {
        await redis.del(`admissions_pipeline:${user.orgId}:${admission.academicYearId}`)
      }
    } catch {}

    return ok(updated)
  }
})
