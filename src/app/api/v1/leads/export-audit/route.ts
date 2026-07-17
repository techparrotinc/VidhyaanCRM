import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'

// Lead CSV export is generated entirely client-side (Blob/data URL) — unlike
// admissions/reports exports, nothing server-side ever saw the export happen.
// The frontend calls this right before generating the file so PII leaving
// the app (parent name/phone/email) at least leaves an audit trail of who
// exported what, when, and how many rows.
const bodySchema = z.object({
  count: z.number().int().min(0),
  scope: z.enum(['selected', 'all', 'filtered']).default('selected')
})

export const POST = route({
  module: MODULES.LEAD_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST],
  handler: async ({ req, user }) => {
    const body = bodySchema.parse(await req.json())

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: 'EXPORT',
        entityType: 'lead',
        entityId: user.orgId,
        after: { scope: body.scope, rows: body.count }
      }
    }).catch(err => console.error('Lead export audit log failed:', err))

    return ok({ logged: true })
  }
})
