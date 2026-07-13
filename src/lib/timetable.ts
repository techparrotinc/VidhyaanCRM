import { z } from 'zod'
import { Errors } from '@/lib/api/errors'

export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

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
