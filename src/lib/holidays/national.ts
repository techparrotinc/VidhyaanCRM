// National-holiday defaults. Fixed-date gazetted holidays only — lunar
// festivals (Holi, Diwali, Eid…) shift every year, so orgs add those manually
// from Settings → Attendance → Holidays.
//
// Org config lives under Organization.settings.holidays (same JSON-merge
// pattern as settings.attendance):
//   nationalEnabled     — explicit toggle; when absent, SCHOOL orgs default ON
//   nationalSeededYears — years already seeded, so a row the admin deleted is
//                         never resurrected by the lazy ensure pass

import { toDbDate, dbDateToString } from '@/lib/attendance/dates'

export const HOLIDAY_SOURCE = { CUSTOM: 'CUSTOM', NATIONAL: 'NATIONAL' } as const

/** Fixed-date national holidays (month is 1-based). */
export const NATIONAL_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' },
  { month: 12, day: 25, name: 'Christmas Day' }
]

export type HolidaySettings = {
  nationalEnabled: boolean
  nationalSeededYears: number[]
}

/** 'YYYY-MM-DD' for the current IST day. */
export function istTodayString(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function resolveHolidaySettings(
  orgSettings: unknown,
  institutionType: string
): HolidaySettings {
  const raw = (orgSettings as any)?.holidays ?? {}
  return {
    nationalEnabled:
      typeof raw.nationalEnabled === 'boolean'
        ? raw.nationalEnabled
        : institutionType === 'SCHOOL',
    nationalSeededYears: Array.isArray(raw.nationalSeededYears)
      ? raw.nationalSeededYears.filter((y: unknown) => typeof y === 'number')
      : []
  }
}

export function nationalHolidayRows(orgId: string, year: number) {
  return NATIONAL_HOLIDAYS.map(h => ({
    orgId,
    name: h.name,
    source: HOLIDAY_SOURCE.NATIONAL,
    date: toDbDate(
      `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`
    )
  }))
}

type HolidayDb = {
  holiday: {
    createMany(args: { data: any[]; skipDuplicates: boolean }): Promise<{ count: number }>
    deleteMany(args: { where: any }): Promise<{ count: number }>
  }
  organization: {
    update(args: { where: { id: string }; data: { settings: any } }): Promise<unknown>
  }
}

/**
 * Seed national holidays for the current + next calendar year if the org has
 * them enabled and those years were not seeded before. Idempotent and safe
 * under races (skipDuplicates + per-year seeded ledger). Called lazily from
 * the dashboard banner API so existing orgs get covered without a backfill.
 */
export async function ensureNationalHolidays(
  db: HolidayDb,
  orgId: string,
  orgSettings: unknown,
  institutionType: string
): Promise<void> {
  const resolved = resolveHolidaySettings(orgSettings, institutionType)
  if (!resolved.nationalEnabled) return

  const currentYear = Number(istTodayString().slice(0, 4))
  const years = [currentYear, currentYear + 1].filter(
    y => !resolved.nationalSeededYears.includes(y)
  )
  if (years.length === 0) return

  await db.holiday.createMany({
    data: years.flatMap(y => nationalHolidayRows(orgId, y)),
    skipDuplicates: true
  })
  await db.organization.update({
    where: { id: orgId },
    data: {
      settings: mergeHolidaySettings(orgSettings, {
        nationalSeededYears: [...resolved.nationalSeededYears, ...years].sort()
      })
    }
  })
}

/** Turn the national toggle on/off: on re-seeds, off deletes future NATIONAL rows. */
export async function setNationalHolidaysEnabled(
  db: HolidayDb,
  orgId: string,
  orgSettings: unknown,
  institutionType: string,
  enabled: boolean
): Promise<void> {
  if (enabled) {
    const currentYear = Number(istTodayString().slice(0, 4))
    const years = [currentYear, currentYear + 1]
    await db.holiday.createMany({
      data: years.flatMap(y => nationalHolidayRows(orgId, y)),
      skipDuplicates: true
    })
    await db.organization.update({
      where: { id: orgId },
      data: {
        settings: mergeHolidaySettings(orgSettings, {
          nationalEnabled: true,
          nationalSeededYears: years
        })
      }
    })
  } else {
    await db.holiday.deleteMany({
      where: {
        source: HOLIDAY_SOURCE.NATIONAL,
        date: { gte: toDbDate(istTodayString()) }
      }
    })
    await db.organization.update({
      where: { id: orgId },
      data: {
        settings: mergeHolidaySettings(orgSettings, {
          nationalEnabled: false,
          nationalSeededYears: []
        })
      }
    })
  }
}

function mergeHolidaySettings(orgSettings: unknown, patch: Partial<HolidaySettings>) {
  const settings = (orgSettings as any) || {}
  return { ...settings, holidays: { ...(settings.holidays ?? {}), ...patch } }
}

// ---------------------------------------------------------------------------
// Banner payload helpers
// ---------------------------------------------------------------------------

export type HolidayRange = {
  name: string
  source: string
  /** 'YYYY-MM-DD' inclusive bounds — single-day holidays have start === end. */
  startDate: string
  endDate: string
}

/** Merge consecutive same-name rows (e.g. a 3-day break) into one range. */
export function groupHolidayRanges(
  rows: { name: string; source: string; date: Date }[]
): HolidayRange[] {
  const ranges: HolidayRange[] = []
  for (const row of rows) {
    const dateStr = dbDateToString(row.date)
    const last = ranges[ranges.length - 1]
    if (last && last.name === row.name && nextDay(last.endDate) === dateStr) {
      last.endDate = dateStr
    } else {
      ranges.push({ name: row.name, source: row.source, startDate: dateStr, endDate: dateStr })
    }
  }
  return ranges
}

function nextDay(dateStr: string): string {
  const d = toDbDate(dateStr)
  d.setUTCDate(d.getUTCDate() + 1)
  return dbDateToString(d)
}

export function daysBetween(fromStr: string, toStr: string): number {
  return Math.round((toDbDate(toStr).getTime() - toDbDate(fromStr).getTime()) / 86_400_000)
}
