import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES, ORG_ROLES } from '@/constants/roles'
import { parseQuery } from '@/lib/api/query'
import { slotSchema, normalizeSlot, assertNoOverlap } from '@/lib/timetable'

// Weekly class timetable. Structural academic config like the class/section
// master — role-gated, not module-gated. Grade/section stored as strings
// matching Student.gradeLabel/section; the class master drives the pickers.

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

export const GET = route({
  roles: [...ORG_ROLES], // teachers get read access
  handler: async ({ req, db }) => {
    const q = parseQuery(req.url, {
      gradeLabel: z.string().trim().min(1),
      section: z.string().trim().optional()
    })
    const sectionKey = q.section?.trim() || null

    const slots = await db.timetableSlot.findMany({
      where: {
        gradeLabel: q.gradeLabel,
        // a section view includes whole-class slots
        ...(sectionKey ? { sectionKey: { in: [sectionKey, 'ALL'] } } : {})
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { teacher: { select: { id: true, name: true } } }
    })
    return ok({ slots })
  }
})

export const POST = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const body = normalizeSlot(slotSchema.parse(await req.json()))
    await assertNoOverlap(db, body)

    const slot = await db.timetableSlot.create({
      data: {
        orgId: user.orgId,
        gradeLabel: body.gradeLabel,
        section: body.section,
        sectionKey: body.sectionKey,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        subject: body.subject,
        teacherId: body.teacherId,
        room: body.room
      },
      include: { teacher: { select: { id: true, name: true } } }
    })
    return created({ slot })
  }
})
