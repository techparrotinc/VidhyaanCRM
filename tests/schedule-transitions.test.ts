import { describe, it, expect } from 'vitest'
import { AppError } from '@/lib/api/errors'
import { assertEditable, assertCancellable, assertRemindable, assertNotPast } from '@/lib/schedule/transitions'

describe('schedule session state transitions', () => {
  it('allows editing SCHEDULED and ONGOING sessions', () => {
    expect(() => assertEditable('SCHEDULED')).not.toThrow()
    expect(() => assertEditable('ONGOING')).not.toThrow()
  })

  it('blocks editing a CANCELLED or COMPLETED session', () => {
    expect(() => assertEditable('CANCELLED')).toThrow(AppError)
    expect(() => assertEditable('COMPLETED')).toThrow(AppError)
  })

  it('allows cancelling SCHEDULED and ONGOING sessions', () => {
    expect(() => assertCancellable('SCHEDULED')).not.toThrow()
    expect(() => assertCancellable('ONGOING')).not.toThrow()
  })

  it('blocks cancelling an already-cancelled session', () => {
    expect(() => assertCancellable('CANCELLED')).toThrow(AppError)
  })

  it('blocks cancelling a completed session', () => {
    expect(() => assertCancellable('COMPLETED')).toThrow(AppError)
  })

  it('blocks reminders for a cancelled session but allows completed/ongoing', () => {
    expect(() => assertRemindable('CANCELLED')).toThrow(AppError)
    expect(() => assertRemindable('SCHEDULED')).not.toThrow()
    expect(() => assertRemindable('ONGOING')).not.toThrow()
    expect(() => assertRemindable('COMPLETED')).not.toThrow()
  })

  describe('assertNotPast', () => {
    const now = new Date('2026-07-20T12:00:00Z')

    it('allows a session that has not started yet', () => {
      expect(() => assertNotPast({ startsAt: new Date('2026-07-20T13:00:00Z'), durationMin: 60 }, now)).not.toThrow()
    })

    it('allows a session currently in progress', () => {
      expect(() => assertNotPast({ startsAt: new Date('2026-07-20T11:30:00Z'), durationMin: 60 }, now)).not.toThrow()
    })

    it('allows a session ending exactly now (half-open — not yet past)', () => {
      expect(() => assertNotPast({ startsAt: new Date('2026-07-20T11:00:00Z'), durationMin: 60 }, now)).not.toThrow()
    })

    it('blocks a session whose window has fully elapsed', () => {
      expect(() => assertNotPast({ startsAt: new Date('2026-07-20T10:00:00Z'), durationMin: 30 }, now)).toThrow(AppError)
    })
  })
})
