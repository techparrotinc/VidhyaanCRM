import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const bulkSchema = z.object({
  action: z.literal('delete'),
  ids: z.array(z.string().min(1)).min(1).max(200)
})

export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  // Soft-deletes only — invoices/payments/parent access are NOT cascaded.
  // Students with an outstanding invoice balance are skipped rather than
  // blocking the whole batch (matches admissions' bulk-delete pattern); org
  // admin only.
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db }) => {
    const body = bulkSchema.parse(await req.json())

    const blockedIds = new Set(
      (await db.invoice.findMany({
        where: {
          studentId: { in: body.ids },
          deletedAt: null,
          status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] }
        },
        select: { studentId: true },
        distinct: ['studentId']
      })).map(i => i.studentId)
    )
    const deletableIds = body.ids.filter(id => !blockedIds.has(id))

    const result = await db.student.updateMany({
      where: { id: { in: deletableIds } },
      data: { deletedAt: new Date() }
    })

    return ok({
      deleted: result.count,
      skipped: blockedIds.size,
      skippedIds: [...blockedIds]
    })
  }
})
