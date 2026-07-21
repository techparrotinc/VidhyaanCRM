import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ORG_ROLES } from '@/constants/roles'

// Dropdown feed for the subject picker (timetable builder etc.). Master-first:
// active Subject rows, UNIONed with legacy distinct TimetableSlot.subject
// strings that predate the master (flagged legacy). `empty: true` tells clients
// no master exists yet. Records keep storing the subject NAME string; this only
// drives the dropdown.
export const GET = route({
  roles: [...ORG_ROLES],
  handler: async ({ db }) => {
    const [subjects, slotSubjects] = await Promise.all([
      db.subject.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { name: true }
      }),
      db.timetableSlot.findMany({
        where: { subject: { not: '' } },
        distinct: ['subject'],
        select: { subject: true }
      })
    ])

    const options = subjects.map(s => ({ name: s.name, legacy: false }))
    const known = new Set(options.map(o => o.name.toLowerCase()))

    for (const s of slotSubjects) {
      const name = (s.subject ?? '').trim()
      if (name && !known.has(name.toLowerCase())) {
        options.push({ name, legacy: true })
        known.add(name.toLowerCase())
      }
    }

    return ok({ options, empty: subjects.length === 0 })
  }
})
