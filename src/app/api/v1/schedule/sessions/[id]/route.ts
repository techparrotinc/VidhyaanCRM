import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { SCHEDULE_READ_ROLES, assertCanManage, assertCanAct } from '@/lib/schedule/access'
import { findClash } from '@/lib/schedule/clash'
import { assertEditable, assertNotPast } from '@/lib/schedule/transitions'
import { notifyClassRescheduled } from '@/lib/schedule/notify'

const patchSchema = z.object({
  startsAt: z.coerce.date().optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  teacherId: z.string().nullable().optional(),
  meetingLink: z.string().trim().max(500).nullable().optional(),
  notifyGuardians: z.boolean().default(true)
})

export const PATCH = route({
  module: MODULES.COURSE_SCHEDULE,
  roles: SCHEDULE_READ_ROLES,
  handler: async ({ req, db, user, params }) => {
    const id = params?.id
    const body = patchSchema.parse(await req.json())

    const session = await db.courseSession.findUnique({ where: { id } })
    if (!session || session.deletedAt) throw Errors.notFound('Session')

    // Meeting-link-only edit is available to whoever may act on the session
    // (admin or the assigned teacher); reschedule (time/duration/teacher
    // change) is admin-only.
    const isReschedule = body.startsAt !== undefined || body.durationMin !== undefined || body.teacherId !== undefined
    if (isReschedule) assertCanManage(user)
    else await assertCanAct(db, user, session)

    assertEditable(session.status)
    if (isReschedule) assertNotPast(session)

    const nextStartsAt = body.startsAt ?? session.startsAt
    const nextDurationMin = body.durationMin ?? session.durationMin
    const nextTeacherId = body.teacherId !== undefined ? body.teacherId : session.teacherId

    if (isReschedule && nextTeacherId) {
      const dayBefore = new Date(nextStartsAt.getTime() - 24 * 60 * 60 * 1000)
      const dayAfter = new Date(nextStartsAt.getTime() + 24 * 60 * 60 * 1000)
      const candidates = await db.courseSession.findMany({
        where: {
          teacherId: nextTeacherId,
          status: { not: 'CANCELLED' },
          startsAt: { gte: dayBefore, lte: dayAfter }
        },
        select: { id: true, startsAt: true, durationMin: true, course: { select: { name: true } }, batch: { select: { name: true } } }
      })
      const clash = findClash(
        { id: session.id, startsAt: nextStartsAt, durationMin: nextDurationMin },
        candidates.map(c => ({ id: c.id, startsAt: c.startsAt, durationMin: c.durationMin }))
      )
      if (clash) {
        const conflicting = candidates.find(c => c.id === clash.id)
        throw Errors.conflict('Teacher is already booked for another session at this time', {
          conflictingSession: conflicting
            ? {
                id: conflicting.id,
                startsAt: conflicting.startsAt,
                durationMin: conflicting.durationMin,
                label: conflicting.course?.name ?? conflicting.batch?.name ?? null
              }
            : null
        })
      }
    }

    const previousStartsAt = session.startsAt

    const updated = await db.courseSession.update({
      where: { id },
      data: {
        startsAt: nextStartsAt,
        durationMin: nextDurationMin,
        teacherId: nextTeacherId,
        ...(body.meetingLink !== undefined ? { meetingLink: body.meetingLink } : {}),
        status: isReschedule ? 'SCHEDULED' : session.status
      }
    })

    if (isReschedule && session.attendanceSessionId) {
      const endsAt = new Date(nextStartsAt.getTime() + nextDurationMin * 60_000)
      await db.attendanceSession.update({
        where: { id: session.attendanceSessionId },
        data: { date: nextStartsAt, startsAt: nextStartsAt, endsAt }
      }).catch(() => {}) // best-effort — never block the reschedule on this
    }

    if (isReschedule && body.notifyGuardians) {
      notifyClassRescheduled(db, user.orgId, updated, previousStartsAt).catch(err =>
        console.error('Class reschedule notify:', err)
      )
    }

    return ok({ session: updated })
  }
})
