// Pure schedule-layout helpers for the LC custom-schedule builder. Turn a
// cadence (how many sessions a week + how long each) into concrete weekly slots
// the admin can review before saving. The number of sessions per week can be
// derived straight from the course's weekly hours ("30 min twice a week" =
// 1 hour/week ÷ 30 min = 2 sessions), which is the "based on the no. of hours"
// input the product asked for. No DB, no time-zone math — HH:mm strings only.

export type ProposedSlot = {
  dayOfWeek: number // ISO 1=Mon..7=Sun
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationMin: number
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** Add minutes to an HH:mm clock string (same-day; wraps at 24h defensively). */
export function addMinutes(hhmm: string, mins: number): string {
  if (!HHMM.test(hhmm)) throw new Error(`Invalid time: ${hhmm}`)
  const [h, m] = hhmm.split(':').map(Number)
  const total = ((h * 60 + m + mins) % 1440 + 1440) % 1440
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Sessions per week implied by weekly hours and per-session length.
 * e.g. hoursPerWeek=1, durationMin=30 → 2. Rounds to the nearest whole session,
 * floored at 1 when there is any positive input.
 */
export function sessionsPerWeekFromHours(hoursPerWeek: number, durationMin: number): number {
  if (hoursPerWeek <= 0 || durationMin <= 0) return 0
  return Math.max(1, Math.round((hoursPerWeek * 60) / durationMin))
}

// When the admin hasn't picked enough preferred days, fill from a spread that
// keeps sessions apart across the week (Mon, Wed, Fri, then Tue, Thu, Sat, Sun).
const DEFAULT_SPREAD = [1, 3, 5, 2, 4, 6, 7]

/**
 * Propose `sessionsPerWeek` weekly slots of `durationMin` each starting at
 * `startTime`, preferring the admin's chosen days and topping up from a spread.
 * Deterministic and idempotent — same input, same slots (sorted by weekday).
 */
export function proposeSlots(opts: {
  sessionsPerWeek: number
  durationMin: number
  startTime: string
  preferredDays?: number[] // ISO 1..7
}): ProposedSlot[] {
  const { sessionsPerWeek, durationMin, startTime } = opts
  if (sessionsPerWeek <= 0 || durationMin <= 0) return []
  if (!HHMM.test(startTime)) throw new Error(`Invalid startTime: ${startTime}`)

  const wanted = Math.min(sessionsPerWeek, 7) // at most one slot per weekday
  const preferred = (opts.preferredDays ?? []).filter(d => Number.isInteger(d) && d >= 1 && d <= 7)

  const days: number[] = []
  for (const d of preferred) {
    if (days.length >= wanted) break
    if (!days.includes(d)) days.push(d)
  }
  for (const d of DEFAULT_SPREAD) {
    if (days.length >= wanted) break
    if (!days.includes(d)) days.push(d)
  }

  const endTime = addMinutes(startTime, durationMin)
  return days
    .sort((a, b) => a - b)
    .map(dayOfWeek => ({ dayOfWeek, startTime, endTime, durationMin }))
}
