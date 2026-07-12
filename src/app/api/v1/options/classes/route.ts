import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ORG_ROLES } from '@/constants/roles'

// Dropdown feed for class + section pickers across lead/admission/student/fee
// forms. Master-first: active SchoolClass rows with their sections, UNIONed
// with legacy distinct student gradeLabel/section strings that predate the
// master (flagged legacy so UIs can de-emphasise them). `empty: true` tells
// clients no master exists yet → fall back to the static GRADE_OPTIONS list.

export const GET = route({
  roles: [...ORG_ROLES],
  handler: async ({ db }) => {
    const [classes, pairs] = await Promise.all([
      db.schoolClass.findMany({
        where: { deletedAt: null, isActive: true },
        include: { sections: { where: { isActive: true }, orderBy: { name: 'asc' } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }),
      db.student.groupBy({
        by: ['gradeLabel', 'section'],
        where: { deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } }
      })
    ])

    const options = classes.map(c => ({
      name: c.name,
      gradeSlug: c.gradeSlug,
      sections: c.sections.map(s => s.name),
      legacy: false
    }))
    const known = new Set(options.map(o => o.name.toLowerCase()))

    // Legacy strings not covered by the master stay reachable.
    const legacyByName = new Map<string, Set<string>>()
    for (const p of pairs) {
      const name = (p.gradeLabel as string).trim()
      if (!name || known.has(name.toLowerCase())) {
        // master class exists — still surface legacy sections it doesn't know
        const opt = options.find(o => o.name.toLowerCase() === name.toLowerCase())
        if (opt && p.section?.trim() && !opt.sections.some(s => s.toLowerCase() === p.section!.trim().toLowerCase())) {
          opt.sections.push(p.section.trim())
        }
        continue
      }
      const sections = legacyByName.get(name) ?? new Set<string>()
      if (p.section?.trim()) sections.add(p.section.trim())
      legacyByName.set(name, sections)
    }
    for (const [name, sections] of legacyByName) {
      options.push({ name, gradeSlug: null, sections: [...sections].sort(), legacy: true })
    }

    return ok({ options, empty: classes.length === 0 })
  }
})
