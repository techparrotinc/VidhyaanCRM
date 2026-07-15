// Teacher double-booking check for reschedule. Pure so it's cheap to unit
// test every edge case (adjacent vs overlapping, custom durations) without a
// DB. [start, start+durationMin) — half-open, so back-to-back sessions
// (session A ends exactly when session B starts) do NOT clash.

export type SessionWindow = {
  id: string
  startsAt: Date
  durationMin: number
}

export function overlaps(a: SessionWindow, b: SessionWindow): boolean {
  const aStart = a.startsAt.getTime()
  const aEnd = aStart + a.durationMin * 60_000
  const bStart = b.startsAt.getTime()
  const bEnd = bStart + b.durationMin * 60_000
  return aStart < bEnd && bStart < aEnd
}

/** First other session (by id) that overlaps `candidate`, or null. */
export function findClash(candidate: SessionWindow, others: SessionWindow[]): SessionWindow | null {
  return others.find(o => o.id !== candidate.id && overlaps(candidate, o)) ?? null
}
