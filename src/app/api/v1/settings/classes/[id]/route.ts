import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  addSections: z.array(z.string().trim().min(1).max(50)).max(26).optional(),
  removeSectionIds: z.array(z.string()).optional()
})

export const PATCH = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = (await params)?.id
    const body = patchSchema.parse(await req.json())

    const existing = await db.schoolClass.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) throw Errors.notFound('Class')

    if (body.removeSectionIds?.length) {
      // Block removing a section that still has active students.
      const sections = await db.classSection.findMany({
        where: { id: { in: body.removeSectionIds }, classId: id }
      })
      for (const s of sections) {
        const count = await db.student.count({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
            gradeLabel: { equals: existing.name, mode: 'insensitive' },
            section: { equals: s.name, mode: 'insensitive' }
          }
        })
        if (count > 0) {
          throw Errors.validation({
            sections: [`Section ${s.name} has ${count} active student(s). Move them first.`]
          })
        }
      }
      await db.classSection.deleteMany({
        where: { id: { in: body.removeSectionIds }, classId: id }
      })
    }

    if (body.addSections?.length) {
      await db.classSection.createMany({
        data: [...new Set(body.addSections.map(s => s.toUpperCase()))].map(name => ({
          orgId: user.orgId,
          classId: id!,
          name
        })),
        skipDuplicates: true
      })
    }

    const updated = await db.schoolClass.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name, gradeSlug: mapGradeValue(body.name) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {})
      },
      include: { sections: { where: { isActive: true }, orderBy: { name: 'asc' } } }
    })
    return ok({ class: updated })
  }
})

export const DELETE = route({
  roles: ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    const existing = await db.schoolClass.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) throw Errors.notFound('Class')

    const count = await db.student.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        gradeLabel: { equals: existing.name, mode: 'insensitive' }
      }
    })
    if (count > 0) {
      throw Errors.validation({
        class: [`${existing.name} has ${count} active student(s). Move or promote them first.`]
      })
    }

    await db.schoolClass.update({ where: { id }, data: { deletedAt: new Date() } })
    return ok({ deleted: true })
  }
})
