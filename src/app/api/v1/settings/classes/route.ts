import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { GRADE_LABEL_OPTIONS } from '@/constants/grades'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

// Class/section master for school-type orgs. Structural settings (like the
// admission pipeline) — role-gated, not module-gated. Student records keep
// storing the name STRING (gradeLabel/section); this master only drives
// dropdowns, so counts below are string-matched.

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]
const ladder = new Map(GRADE_LABEL_OPTIONS.map((label, i) => [label.toLowerCase(), i]))

export const GET = route({
  roles: ADMIN_ROLES,
  handler: async ({ db }) => {
    const [classes, pairCounts] = await Promise.all([
      db.schoolClass.findMany({
        where: { deletedAt: null },
        include: { sections: { where: { isActive: true }, orderBy: { name: 'asc' } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }),
      db.student.groupBy({
        by: ['gradeLabel', 'section'],
        where: { deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } },
        _count: { _all: true }
      })
    ])

    const countFor = (className: string, section?: string | null) =>
      pairCounts
        .filter(p => {
          if ((p.gradeLabel ?? '').toLowerCase() !== className.toLowerCase()) return false
          if (section === undefined) return true
          return (p.section ?? '').toLowerCase() === (section ?? '').toLowerCase()
        })
        .reduce((sum, p) => sum + p._count._all, 0)

    return ok({
      classes: classes.map(c => ({
        ...c,
        studentCount: countFor(c.name),
        sections: c.sections.map(s => ({ ...s, studentCount: countFor(c.name, s.name) }))
      }))
    })
  }
})

const postSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sections: z.array(z.string().trim().min(1).max(50)).max(26).default([])
})

export const POST = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const body = postSchema.parse(await req.json())

    const existing = await db.schoolClass.findFirst({
      where: { name: { equals: body.name, mode: 'insensitive' }, deletedAt: null }
    })
    if (existing) throw Errors.validation({ name: ['This class already exists'] })

    // Revive a soft-deleted class of the same name instead of violating the unique.
    const deleted = await db.schoolClass.findFirst({
      where: { name: { equals: body.name, mode: 'insensitive' } }
    })

    const sortOrder = ladder.get(body.name.toLowerCase()) ?? 900
    const sectionNames = [...new Set(body.sections.map(s => s.toUpperCase()))]

    const schoolClass = deleted
      ? await db.schoolClass.update({
          where: { id: deleted.id },
          data: { deletedAt: null, isActive: true, sortOrder },
          include: { sections: true }
        })
      : await db.schoolClass.create({
          data: {
            orgId: user.orgId,
            name: body.name,
            gradeSlug: mapGradeValue(body.name),
            sortOrder
          },
          include: { sections: true }
        })

    if (sectionNames.length > 0) {
      await db.classSection.createMany({
        data: sectionNames.map(name => ({
          orgId: user.orgId,
          classId: schoolClass.id,
          name
        })),
        skipDuplicates: true
      })
    }

    const withSections = await db.schoolClass.findUnique({
      where: { id: schoolClass.id },
      include: { sections: { where: { isActive: true }, orderBy: { name: 'asc' } } }
    })
    return created({ class: withSections })
  }
})
