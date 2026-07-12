import { describe, it, expect } from 'vitest'
import { computeStats } from '@/lib/attendance/stats'
import { buildTargetKey } from '@/lib/attendance/access'
import { toDbDate, dbDateToString, isoWeekday, isWorkingDay, monthRange } from '@/lib/attendance/dates'
import { resolveAttendanceSettings, DEFAULT_ATTENDANCE_SETTINGS } from '@/lib/attendance/settings'
import type { AttendanceStatus } from '@prisma/client'

const s = (...statuses: AttendanceStatus[]) => statuses

describe('computeStats', () => {
  it('counts each status and computes the percentage', () => {
    const stats = computeStats(s('PRESENT', 'PRESENT', 'ABSENT', 'HALF_DAY'))
    expect(stats.present).toBe(2)
    expect(stats.absent).toBe(1)
    expect(stats.halfDay).toBe(1)
    expect(stats.workingDays).toBe(4)
    // (2 + 0.5) / 4 = 62.5
    expect(stats.percentage).toBe(62.5)
  })

  it('excludes holidays from the denominator', () => {
    const stats = computeStats(s('PRESENT', 'HOLIDAY', 'HOLIDAY'))
    expect(stats.workingDays).toBe(1)
    expect(stats.holiday).toBe(2)
    expect(stats.percentage).toBe(100)
  })

  it('treats leave as unattended but counted', () => {
    const stats = computeStats(s('PRESENT', 'LEAVE'))
    expect(stats.percentage).toBe(50)
  })

  it('returns null percentage when nothing marked', () => {
    expect(computeStats([]).percentage).toBeNull()
    expect(computeStats(s('HOLIDAY')).percentage).toBeNull()
  })
})

describe('buildTargetKey', () => {
  it('joins the tuple with empty slots for nulls', () => {
    expect(buildTargetKey({ gradeLabel: 'Class 5', section: 'A' })).toBe('Class 5|A||')
    expect(buildTargetKey({ courseId: 'c1' })).toBe('||c1|')
    expect(buildTargetKey({ batchId: 'b1' })).toBe('|||b1')
  })

  it('distinguishes grade-with-section from grade-only', () => {
    expect(buildTargetKey({ gradeLabel: 'Class 5' })).not.toBe(
      buildTargetKey({ gradeLabel: 'Class 5', section: 'A' })
    )
  })
})

describe('attendance dates', () => {
  it('round-trips YYYY-MM-DD through UTC midnight', () => {
    const d = toDbDate('2026-07-12')
    expect(d.toISOString()).toBe('2026-07-12T00:00:00.000Z')
    expect(dbDateToString(d)).toBe('2026-07-12')
  })

  it('computes ISO weekdays (2026-07-12 is a Sunday)', () => {
    expect(isoWeekday('2026-07-12')).toBe(7)
    expect(isoWeekday('2026-07-13')).toBe(1)
  })

  it('applies working-day config', () => {
    const monSat = [1, 2, 3, 4, 5, 6]
    expect(isWorkingDay('2026-07-12', monSat)).toBe(false) // Sunday
    expect(isWorkingDay('2026-07-13', monSat)).toBe(true)
  })

  it('builds month ranges spanning year ends', () => {
    const { from, to } = monthRange('2026-12')
    expect(from.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(to.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})

describe('resolveAttendanceSettings', () => {
  it('returns defaults for missing/garbage config', () => {
    expect(resolveAttendanceSettings(null)).toEqual(DEFAULT_ATTENDANCE_SETTINGS)
    expect(resolveAttendanceSettings({ attendance: { workingDays: 'nope' } }).workingDays)
      .toEqual(DEFAULT_ATTENDANCE_SETTINGS.workingDays)
  })

  it('keeps valid overrides and drops invalid weekday numbers', () => {
    const resolved = resolveAttendanceSettings({
      attendance: {
        workingDays: [1, 2, 3, 9, 0],
        absenceAlerts: { enabled: true, whatsapp: true },
        autoMarkOnline: true
      }
    })
    expect(resolved.workingDays).toEqual([1, 2, 3])
    expect(resolved.absenceAlerts.enabled).toBe(true)
    expect(resolved.absenceAlerts.whatsapp).toBe(true)
    expect(resolved.absenceAlerts.portal).toBe(true) // default preserved
    expect(resolved.autoMarkOnline).toBe(true)
  })
})
