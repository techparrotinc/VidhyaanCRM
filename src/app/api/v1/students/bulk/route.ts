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
  // Deleting students takes their invoices, payments and parent access
  // with them — org admin only (matches single-record DELETE).
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db }) => {
    const body = bulkSchema.parse(await req.json())

    const result = await db.student.updateMany({
      where: { id: { in: body.ids } },
      data: { deletedAt: new Date() }
    })

    return ok({ deleted: result.count })
  }
})
