// Rolls a batch's recurring days-of-week/time pattern into concrete
// CourseSession rows ~2 weeks ahead. Idempotent on (batchId, startsAt) via
// upsert-with-noop-update, so re-running never resurrects or overwrites a
// one-off reschedule/cancel already sitting on that row.

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MATERIALIZE_HORIZON_DAYS = 14

type BatchPattern = {
  id: string
  orgId: string
  branchId: string | null
  academicYearId: string | null
  courseId: string | null
  daysOfWeek: string[]
  startTime: string | null
  endTime: string | null
  sessionDurationMin: number | null
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
}

/** Delegate shape satisfied by both the base prisma client (cron, cross-org)
 *  and an org-scoped `forOrg` client (route handlers) — forOrg overwrites
 *  data.orgId regardless, so passing it explicitly is safe either way. */
type SessionClient = {
  attendanceSession: {
    create: (args: any) => Promise<{ id: string }>
    delete: (args: any) => Promise<unknown>
  }
  courseSession: {
    findFirst: (args: any) => Promise<{ id: string } | null>
    create: (args: any) => Promise<unknown>
  }
}

function diffMinutes(startTime: string, endTime: string): number | null {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return null
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

export function effectiveDurationMin(batch: Pick<BatchPattern, 'sessionDurationMin' | 'startTime' | 'endTime'>): number {
  if (batch.sessionDurationMin && batch.sessionDurationMin > 0) return batch.sessionDurationMin
  if (batch.startTime && batch.endTime) {
    const diff = diffMinutes(batch.startTime, batch.endTime)
    if (diff) return diff
  }
  return 60
}

function atTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

/** Default teacher for a freshly materialized session: the sole
 *  TeacherAssignment targeting this batch (or its course), if unambiguous. */
export async function defaultTeacherId(
  db: { teacherAssignment: { findMany: (args: any) => Promise<Array<{ teacherId: string }>> } },
  batch: Pick<BatchPattern, 'id' | 'courseId'>
): Promise<string | null> {
  const rows = await db.teacherAssignment.findMany({
    where: { OR: [{ batchId: batch.id }, ...(batch.courseId ? [{ courseId: batch.courseId }] : [])] },
    select: { teacherId: true }
  })
  const distinct = [...new Set(rows.map(r => r.teacherId))]
  return distinct.length === 1 ? distinct[0] : null
}

/**
 * Materializes occurrences for one batch from `from` (default: today) through
 * `from + horizonDays`. Returns the count of rows created (upserts that hit
 * an existing row are no-ops and don't count).
 */
export async function materializeBatch(
  db: SessionClient,
  batch: BatchPattern,
  opts: { teacherId?: string | null; from?: Date; horizonDays?: number } = {}
): Promise<number> {
  if (!batch.isActive || !batch.startTime || batch.daysOfWeek.length === 0) return 0

  const horizonDays = opts.horizonDays ?? MATERIALIZE_HORIZON_DAYS
  const from = opts.from ?? new Date()
  const durationMin = effectiveDurationMin(batch)
  const wantedDays = new Set(batch.daysOfWeek.map(d => d.slice(0, 3)))

  let created = 0
  for (let offset = 0; offset <= horizonDays; offset++) {
    const day = new Date(from)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)

    if (!wantedDays.has(DAY_LABELS[day.getDay()])) continue
    if (batch.startDate && day < new Date(batch.startDate.toDateString())) continue
    if (batch.endDate && day > new Date(batch.endDate.toDateString())) continue

    const startsAt = atTime(day, batch.startTime)

    // Existence check first (not create+catch): a one-off reschedule/cancel
    // may already occupy this (batchId, startsAt) slot, and we must never
    // touch it — just skip. This also avoids creating an orphan
    // AttendanceSession below when the slot turns out to be taken.
    const already = await db.courseSession.findFirst({
      where: { batchId: batch.id, startsAt },
      select: { id: true }
    })
    if (already) continue

    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000)

    // Session maps 1:1 to the attendance sessionKey (its id) — created
    // alongside so "Mark attendance" and marked-% work the moment the
    // occurrence exists, with no lazy-create branch to keep in sync.
    const attendanceSession = await db.attendanceSession.create({
      data: {
        orgId: batch.orgId,
        branchId: batch.branchId,
        academicYearId: batch.academicYearId,
        date: day,
        courseId: batch.courseId,
        batchId: batch.id,
        startsAt,
        endsAt,
        deliveryMode: 'IN_PERSON'
      }
    })

    try {
      await db.courseSession.create({
        data: {
          orgId: batch.orgId,
          branchId: batch.branchId,
          academicYearId: batch.academicYearId,
          courseId: batch.courseId,
          batchId: batch.id,
          teacherId: opts.teacherId ?? null,
          startsAt,
          durationMin,
          status: 'SCHEDULED',
          attendanceSessionId: attendanceSession.id
        }
      })
      created++
    } catch (err: any) {
      // Race: another materializer run took this slot between our check and
      // create. Clean up the orphaned attendance session and move on —
      // anything but that specific clash is a real failure.
      await db.attendanceSession.delete({ where: { id: attendanceSession.id } }).catch(() => {})
      if (err?.code !== 'P2002') throw err
    }
  }
  return created
}
