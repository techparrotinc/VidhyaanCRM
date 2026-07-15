import { describe, it, expect } from 'vitest'
import { findClash, overlaps } from '@/lib/schedule/clash'

const w = (id: string, startsAt: string, durationMin: number) => ({ id, startsAt: new Date(startsAt), durationMin })

describe('schedule clash detection', () => {
  it('flags fully overlapping sessions', () => {
    const a = w('a', '2026-07-20T10:00:00', 60)
    const b = w('b', '2026-07-20T10:30:00', 60)
    expect(overlaps(a, b)).toBe(true)
  })

  it('flags a session nested inside another', () => {
    const a = w('a', '2026-07-20T10:00:00', 90)
    const b = w('b', '2026-07-20T10:15:00', 30)
    expect(overlaps(a, b)).toBe(true)
  })

  it('does not flag back-to-back adjacent sessions (half-open interval)', () => {
    const a = w('a', '2026-07-20T10:00:00', 60) // 10:00–11:00
    const b = w('b', '2026-07-20T11:00:00', 45) // 11:00–11:45
    expect(overlaps(a, b)).toBe(false)
  })

  it('does not flag sessions on different days', () => {
    const a = w('a', '2026-07-20T10:00:00', 60)
    const b = w('b', '2026-07-21T10:00:00', 60)
    expect(overlaps(a, b)).toBe(false)
  })

  it('handles custom durations (30/45/60/custom minute overlap)', () => {
    const a = w('a', '2026-07-20T10:00:00', 30) // 10:00–10:30
    const b = w('b', '2026-07-20T10:29:00', 45) // 10:29–11:14
    expect(overlaps(a, b)).toBe(true)
  })

  it('findClash ignores the candidate itself and returns the first real clash', () => {
    const candidate = w('self', '2026-07-20T10:00:00', 60)
    const others = [
      w('self', '2026-07-20T10:00:00', 60), // same id as candidate — must be ignored
      w('free', '2026-07-20T08:00:00', 30),
      w('clash', '2026-07-20T10:30:00', 30)
    ]
    const result = findClash(candidate, others)
    expect(result?.id).toBe('clash')
  })

  it('findClash returns null when nothing overlaps', () => {
    const candidate = w('a', '2026-07-20T10:00:00', 60)
    const others = [w('b', '2026-07-20T11:00:00', 60), w('c', '2026-07-20T08:00:00', 60)]
    expect(findClash(candidate, others)).toBeNull()
  })
})
