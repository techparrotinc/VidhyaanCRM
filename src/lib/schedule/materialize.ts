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
    findMany: (args: any) => Promise<Array<{ durationMin: number }>>
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

/** JS getDay() (0=Sun..6=Sat) → ISO day-of-week (1=Mon..7=Sun), matching
 *  EnrollmentScheduleSlot.dayOfWeek and TimetableSlot.dayOfWeek. */
function isoDayOf(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
/** IST calendar date (YYYY-MM-DD) for an instant. */
function istYMD(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
}
/** ISO day-of-week (1=Mon..7=Sun) of a YYYY-MM-DD calendar date. */
function isoDowOf(dateISO: string): number {
  const dow = new Date(`${dateISO}T00:00:00.000Z`).getUTCDay()
  return dow === 0 ? 7 : dow
}
/** Add days to a YYYY-MM-DD string. */
function addDaysISO(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function slotDurationMin(slot: Pick<SchedulePattern, 'durationMin' | 'startTime' | 'endTime'>): number {
  if (slot.durationMin && slot.durationMin > 0) return slot.durationMin
  const diff = diffMinutes(slot.startTime, slot.endTime)
  return diff ?? 60
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

/** One student's custom per-course weekly slot (EnrollmentScheduleSlot). */
export type SchedulePattern = {
  id: string
  dayOfWeek: number // ISO 1=Mon..7=Sun
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationMin: number | null
  teacherId: string | null
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
}

/** The enrollment these slots belong to, plus the course hours budget. */
export type EnrollmentContext = {
  id: string
  orgId: string
  branchId: string | null
  academicYearId: string | null
  courseId: string | null
  studentId: string
  /** Course package hours; generation stops once booked minutes reach it. Null = uncapped. */
  totalHours: number | null
}

/**
 * Materializes per-student sessions for one enrollment's custom schedule slots
 * from `from` (default today) through `from + horizonDays`. Unlike a batch,
 * these sessions carry studentId/enrollmentId/scheduleSlotId and are marked for
 * that single student. All the enrollment's slots share the course `totalHours`
 * budget across every run — occurrences are booked chronologically until the cap
 * is hit. Idempotent on (scheduleSlotId, startsAt). Returns rows created.
 */
export async function materializeEnrollment(
  db: SessionClient,
  enrollment: EnrollmentContext,
  slots: SchedulePattern[],
  opts: { from?: Date; horizonDays?: number } = {}
): Promise<number> {
  const active = slots.filter(s => s.isActive)
  if (active.length === 0) return 0

  const horizonDays = opts.horizonDays ?? MATERIALIZE_HORIZON_DAYS
  const from = opts.from ?? new Date()

  // Shared hours budget across all slots AND past runs. Count already-booked
  // minutes so re-running the cron never exceeds the package once it's full.
  const budgetMin =
    enrollment.totalHours && enrollment.totalHours > 0 ? enrollment.totalHours * 60 : Infinity
  let usedMin = 0
  if (budgetMin !== Infinity) {
    const existing = await db.courseSession.findMany({
      where: { enrollmentId: enrollment.id, deletedAt: null, status: { not: 'CANCELLED' } },
      select: { durationMin: true }
    })
    usedMin = existing.reduce((s, r) => s + r.durationMin, 0)
  }

  // Collect candidate occurrences across the horizon, chronologically — so the
  // hours cap cuts off the latest sessions, not an arbitrary slot.
  type Occ = { slot: SchedulePattern; startsAt: Date; durationMin: number }
  const occ: Occ[] = []
  for (let offset = 0; offset <= horizonDays; offset++) {
    const day = new Date(from)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)
    const iso = isoDayOf(day)
    for (const slot of active) {
      if (slot.dayOfWeek !== iso) continue
      if (slot.startDate && day < new Date(slot.startDate.toDateString())) continue
      if (slot.endDate && day > new Date(slot.endDate.toDateString())) continue
      occ.push({ slot, startsAt: atTime(day, slot.startTime), durationMin: slotDurationMin(slot) })
    }
  }
  occ.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  let created = 0
  for (const o of occ) {
    // Cap reached — every later occurrence is over budget too, so stop.
    if (usedMin + o.durationMin > budgetMin) break

    const already = await db.courseSession.findFirst({
      where: { scheduleSlotId: o.slot.id, startsAt: o.startsAt },
      select: { id: true }
    })
    if (already) {
      // Existing row already counted in usedMin's seed only if it was in the
      // DB at seed time; but occurrences we just created this run are not, so
      // advance the budget to keep the cap correct within a single run.
      usedMin += o.durationMin
      continue
    }

    const dayMidnight = new Date(o.startsAt)
    dayMidnight.setHours(0, 0, 0, 0)
    const endsAt = new Date(o.startsAt.getTime() + o.durationMin * 60_000)

    const attendanceSession = await db.attendanceSession.create({
      data: {
        orgId: enrollment.orgId,
        branchId: enrollment.branchId,
        academicYearId: enrollment.academicYearId,
        date: dayMidnight,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        scheduleSlotId: o.slot.id,
        startsAt: o.startsAt,
        endsAt,
        deliveryMode: 'IN_PERSON'
      }
    })

    try {
      await db.courseSession.create({
        data: {
          orgId: enrollment.orgId,
          branchId: enrollment.branchId,
          academicYearId: enrollment.academicYearId,
          courseId: enrollment.courseId,
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          scheduleSlotId: o.slot.id,
          teacherId: o.slot.teacherId,
          startsAt: o.startsAt,
          durationMin: o.durationMin,
          status: 'SCHEDULED',
          attendanceSessionId: attendanceSession.id
        }
      })
      created++
      usedMin += o.durationMin
    } catch (err: any) {
      await db.attendanceSession.delete({ where: { id: attendanceSession.id } }).catch(() => {})
      if (err?.code !== 'P2002') throw err
      usedMin += o.durationMin
    }
  }
  return created
}

/** One recurring school timetable period. */
export type TimetablePattern = {
  id: string
  orgId: string
  branchId: string | null
  academicYearId: string | null
  gradeLabel: string
  section: string | null // null = whole class (all sections)
  dayOfWeek: number // ISO 1=Mon..7=Sun
  startTime: string // HH:mm
  endTime: string // HH:mm
  subject: string
  teacherId: string | null
}

/**
 * Materializes school period sessions for one timetable slot from `from`
 * through `from + horizonDays`, one per matching weekday. Skips dates that are
 * a one-off cancellation (`cancelledDates`) or a holiday (`holidays`). Creates a
 * CourseSession (Schedule view + reschedule/cancel) paired 1:1 with an
 * AttendanceSession carrying gradeLabel/section/subject so the register loads
 * the class roster. Idempotent on (timetableSlotId, startsAt).
 */
export async function materializeTimetableSlot(
  db: SessionClient,
  slot: TimetablePattern,
  opts: { cancelledDates?: Set<string>; holidays?: Set<string>; from?: Date; horizonDays?: number } = {}
): Promise<number> {
  const horizonDays = opts.horizonDays ?? MATERIALIZE_HORIZON_DAYS
  const durationMin = diffMinutes(slot.startTime, slot.endTime) ?? 60
  const cancelledDates = opts.cancelledDates ?? new Set<string>()
  const holidays = opts.holidays ?? new Set<string>()
  // Timezone-explicit IST so the calendar date + wall-clock time are correct
  // wherever the cron runs (Vercel UTC or a dev box). IST is the product's
  // day convention (see parent-schedule / report rollups).
  const fromISO = istYMD(opts.from ?? new Date())

  let created = 0
  for (let offset = 0; offset <= horizonDays; offset++) {
    const dateISO = addDaysISO(fromISO, offset)
    if (isoDowOf(dateISO) !== slot.dayOfWeek) continue
    if (cancelledDates.has(dateISO) || holidays.has(dateISO)) continue

    const startsAt = new Date(`${dateISO}T${slot.startTime}:00.000+05:30`)
    const already = await db.courseSession.findFirst({
      where: { timetableSlotId: slot.id, startsAt },
      select: { id: true }
    })
    if (already) continue

    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000)
    const attendanceSession = await db.attendanceSession.create({
      data: {
        orgId: slot.orgId,
        branchId: slot.branchId,
        academicYearId: slot.academicYearId,
        date: new Date(`${dateISO}T00:00:00.000Z`), // @db.Date — store the IST calendar date
        gradeLabel: slot.gradeLabel,
        section: slot.section,
        subject: slot.subject,
        timetableSlotId: slot.id,
        startsAt,
        endsAt,
        deliveryMode: 'IN_PERSON'
      }
    })

    try {
      await db.courseSession.create({
        data: {
          orgId: slot.orgId,
          branchId: slot.branchId,
          academicYearId: slot.academicYearId,
          timetableSlotId: slot.id,
          gradeLabel: slot.gradeLabel,
          section: slot.section,
          subject: slot.subject,
          teacherId: slot.teacherId,
          startsAt,
          durationMin,
          status: 'SCHEDULED',
          attendanceSessionId: attendanceSession.id
        }
      })
      created++
    } catch (err: any) {
      await db.attendanceSession.delete({ where: { id: attendanceSession.id } }).catch(() => {})
      if (err?.code !== 'P2002') throw err
    }
  }
  return created
}
