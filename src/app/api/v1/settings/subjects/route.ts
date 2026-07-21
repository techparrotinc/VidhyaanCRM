import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

// Subject master for school-type orgs. Structural settings (like the class
// master) — role-gated, not module-gated. Records keep storing the subject
// NAME string; this master only drives dropdowns, so counts are string-matched
// against TimetableSlot.subject.
const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

export const GET = route({
  roles: ADMIN_ROLES,
  handler: async ({ db }) => {
    const [subjects, usage] = await Promise.all([
      db.subject.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }),
      db.timetableSlot.groupBy({
        by: ['subject'],
        _count: { _all: true }
      })
    ])

    const usageFor = (name: string) =>
      usage
        .filter(u => (u.subject ?? '').toLowerCase() === name.toLowerCase())
        .reduce((sum, u) => sum + u._count._all, 0)

    return ok({ subjects: subjects.map(s => ({ ...s, slotCount: usageFor(s.name) })) })
  }
})

const postSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional()
})

export const POST = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const body = postSchema.parse(await req.json())

    const existing = await db.subject.findFirst({
      where: { name: { equals: body.name, mode: 'insensitive' }, deletedAt: null }
    })
    if (existing) throw Errors.validation({ name: ['This subject already exists'] })

    // Revive a soft-deleted subject of the same name instead of hitting the unique.
    const deleted = await db.subject.findFirst({
      where: { name: { equals: body.name, mode: 'insensitive' } }
    })

    const subject = deleted
      ? await db.subject.update({
          where: { id: deleted.id },
          data: { deletedAt: null, isActive: true, name: body.name, sortOrder: body.sortOrder ?? 0 }
        })
      : await db.subject.create({
          data: { orgId: user.orgId, name: body.name, sortOrder: body.sortOrder ?? 0 }
        })

    return created({ subject })
  }
})
