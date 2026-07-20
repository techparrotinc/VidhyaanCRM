import { z } from 'zod'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export const TIMETABLE_ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]
// Read access includes teachers; edit/swap/cancel is admin OR the slot's own
// teacher (a teacher managing their own periods).
export const TIMETABLE_MANAGE_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER]

/** True if this user may edit/swap/cancel the given slot. */
export function canManageSlot(
  user: { id: string; role: string },
  slot: { teacherId: string | null }
): boolean {
  if (TIMETABLE_ADMIN_ROLES.includes(user.role as any)) return true
  return user.role === ROLES.TEACHER && slot.teacherId === user.id
}

/** ISO date (YYYY-MM-DD) for a slot's occurrence in the week starting `weekStart` (Monday). */
export function slotDateInWeek(weekStartISO: string, dayOfWeek: number): string {
  const d = new Date(`${weekStartISO}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + (dayOfWeek - 1))
  return d.toISOString().slice(0, 10)
}

export const slotSchema = z.object({
  gradeLabel: z.string().trim().min(1).max(100),
  section: z.string().trim().max(50).optional().nullable(),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(HHMM, 'Expected HH:mm'),
  endTime: z.string().regex(HHMM, 'Expected HH:mm'),
  subject: z.string().trim().min(1).max(120),
  teacherId: z.string().trim().optional().nullable(),
  room: z.string().trim().max(60).optional().nullable()
})

export function normalizeSlot(body: z.infer<typeof slotSchema>) {
  const section = body.section?.trim() || null
  if (body.endTime <= body.startTime) {
    throw Errors.validation({ endTime: ['End time must be after start time'] })
  }
  return {
    ...body,
    section,
    sectionKey: section ?? 'ALL',
    teacherId: body.teacherId || null,
    room: body.room?.trim() || null
  }
}

type TimetableDb = {
  timetableSlot: {
    findFirst(args: unknown): Promise<{ id: string; subject: string; startTime: string; endTime: string } | null>
  }
}

/** Overlap: same class+section scope, same day, intersecting [start, end). */
export async function assertNoOverlap(
  db: TimetableDb,
  slot: { gradeLabel: string; sectionKey: string; dayOfWeek: number; startTime: string; endTime: string },
  excludeId?: string
) {
  const clash = await db.timetableSlot.findFirst({
    where: {
      gradeLabel: slot.gradeLabel,
      // whole-class slots clash with every section and vice-versa
      ...(slot.sectionKey === 'ALL' ? {} : { sectionKey: { in: [slot.sectionKey, 'ALL'] } }),
      dayOfWeek: slot.dayOfWeek,
      startTime: { lt: slot.endTime },
      endTime: { gt: slot.startTime },
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true, subject: true, startTime: true, endTime: true }
  })
  if (clash) {
    throw Errors.validation({
      startTime: [`Overlaps with ${clash.subject} (${clash.startTime}–${clash.endTime})`]
    })
  }
}
