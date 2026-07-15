// Session status state-machine guards. Pure and DB-free so every transition
// edge case is cheap to unit test.

import { Errors } from '@/lib/api/errors'

export type CourseSessionStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

const TERMINAL: CourseSessionStatus[] = ['CANCELLED', 'COMPLETED']

/** Throws unless the session may still be edited (meeting link or reschedule). */
export function assertEditable(status: CourseSessionStatus): void {
  if (TERMINAL.includes(status)) {
    throw Errors.businessRule(`Cannot edit a ${status.toLowerCase()} session`)
  }
}

/** Throws unless the session may still be cancelled. */
export function assertCancellable(status: CourseSessionStatus): void {
  if (status === 'CANCELLED') throw Errors.businessRule('Session is already cancelled')
  if (status === 'COMPLETED') throw Errors.businessRule('Cannot cancel a completed session')
}

/** Throws unless a reminder may still be sent (not cancelled). */
export function assertRemindable(status: CourseSessionStatus): void {
  if (status === 'CANCELLED') throw Errors.businessRule('Cannot remind for a cancelled session')
}

/**
 * Throws once a session's time window has fully elapsed. The stored status
 * stays SCHEDULED after the fact (no sweep job flips it to COMPLETED — the
 * UI derives "completed" from the clock for display); this guard is what
 * actually stops editing/cancelling something that already happened.
 */
export function assertNotPast(
  session: { startsAt: Date; durationMin: number },
  now: Date = new Date()
): void {
  const endsAt = new Date(session.startsAt.getTime() + session.durationMin * 60_000)
  if (endsAt < now) {
    throw Errors.businessRule('Cannot edit a session that has already happened')
  }
}
