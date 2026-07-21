import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional()
})

// Rename/reorder/toggle. Renaming only changes the dropdown label; existing
// records keep the old string (master is not the source of truth for storage).
export const PATCH = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Subject')
    const existing = await db.subject.findFirst({ where: { id, deletedAt: null } })
    if (!existing) throw Errors.notFound('Subject')

    const body = patchSchema.parse(await req.json())

    if (body.name && body.name.toLowerCase() !== existing.name.toLowerCase()) {
      const clash = await db.subject.findFirst({
        where: { name: { equals: body.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } }
      })
      if (clash) throw Errors.validation({ name: ['This subject already exists'] })
    }

    const subject = await db.subject.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
      }
    })
    return ok({ subject })
  }
})

// Soft delete — the master row goes away; records keep their string values.
export const DELETE = route({
  roles: ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    if (!id) throw Errors.notFound('Subject')
    const existing = await db.subject.findFirst({ where: { id, deletedAt: null } })
    if (!existing) throw Errors.notFound('Subject')
    await db.subject.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
    return ok({ deleted: true })
  }
})
