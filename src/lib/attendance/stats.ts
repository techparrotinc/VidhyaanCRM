import { AttendanceStatus } from '@prisma/client'

export type AttendanceStats = {
  /** Marked non-holiday entries — the percentage denominator. */
  workingDays: number
  present: number
  absent: number
  halfDay: number
  leave: number
  holiday: number
  /** (present + 0.5 * halfDay) / workingDays, 0–100, 1 decimal. Null when nothing marked. */
  percentage: number | null
}

/**
 * Record-driven stats: the denominator is what was actually marked (minus
 * holidays), so no calendar math can disagree with the register.
 */
export function computeStats(statuses: AttendanceStatus[]): AttendanceStats {
  const counts = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0, HOLIDAY: 0 }
  for (const s of statuses) counts[s]++
  const workingDays = statuses.length - counts.HOLIDAY
  const attended = counts.PRESENT + 0.5 * counts.HALF_DAY
  return {
    workingDays,
    present: counts.PRESENT,
    absent: counts.ABSENT,
    halfDay: counts.HALF_DAY,
    leave: counts.LEAVE,
    holiday: counts.HOLIDAY,
    percentage: workingDays > 0 ? Math.round((attended / workingDays) * 1000) / 10 : null
  }
}
