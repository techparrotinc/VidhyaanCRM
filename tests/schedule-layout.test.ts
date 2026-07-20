import { describe, it, expect } from 'vitest'
import { addMinutes, sessionsPerWeekFromHours, proposeSlots } from '@/lib/schedule/layout'

describe('addMinutes', () => {
  it('adds within the hour', () => {
    expect(addMinutes('18:30', 30)).toBe('19:00')
  })
  it('rolls across the hour', () => {
    expect(addMinutes('18:45', 45)).toBe('19:30')
  })
  it('rejects a bad time', () => {
    expect(() => addMinutes('25:00', 10)).toThrow()
  })
})

describe('sessionsPerWeekFromHours', () => {
  it('derives "30 min twice a week" from 1 weekly hour', () => {
    expect(sessionsPerWeekFromHours(1, 30)).toBe(2)
  })
  it('one 60-min session for 1 hour/week', () => {
    expect(sessionsPerWeekFromHours(1, 60)).toBe(1)
  })
  it('floors at 1 for any positive input', () => {
    expect(sessionsPerWeekFromHours(0.25, 60)).toBe(1)
  })
  it('is zero when inputs are non-positive', () => {
    expect(sessionsPerWeekFromHours(0, 30)).toBe(0)
    expect(sessionsPerWeekFromHours(2, 0)).toBe(0)
  })
})

describe('proposeSlots', () => {
  it('lays out the target scenario: 30 min, twice a week, 6:30 PM', () => {
    const slots = proposeSlots({
      sessionsPerWeek: 2,
      durationMin: 30,
      startTime: '18:30',
      preferredDays: [1, 3] // Mon, Wed
    })
    expect(slots).toEqual([
      { dayOfWeek: 1, startTime: '18:30', endTime: '19:00', durationMin: 30 },
      { dayOfWeek: 3, startTime: '18:30', endTime: '19:00', durationMin: 30 }
    ])
  })

  it('tops up from the spread when too few preferred days given', () => {
    const slots = proposeSlots({ sessionsPerWeek: 3, durationMin: 60, startTime: '09:00', preferredDays: [2] })
    expect(slots.map(s => s.dayOfWeek)).toEqual([1, 2, 3]) // Tue preferred + Mon, Wed from spread, sorted
    expect(slots.every(s => s.endTime === '10:00')).toBe(true)
  })

  it('caps at one slot per weekday (never more than 7)', () => {
    const slots = proposeSlots({ sessionsPerWeek: 10, durationMin: 30, startTime: '08:00' })
    expect(slots).toHaveLength(7)
    expect(new Set(slots.map(s => s.dayOfWeek)).size).toBe(7)
  })

  it('returns nothing for non-positive counts', () => {
    expect(proposeSlots({ sessionsPerWeek: 0, durationMin: 30, startTime: '08:00' })).toEqual([])
  })

  it('is deterministic', () => {
    const a = proposeSlots({ sessionsPerWeek: 2, durationMin: 45, startTime: '17:00' })
    const b = proposeSlots({ sessionsPerWeek: 2, durationMin: 45, startTime: '17:00' })
    expect(a).toEqual(b)
  })
})
