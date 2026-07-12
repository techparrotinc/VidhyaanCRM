// Attendance date math. AttendanceRecord.date is a Postgres DATE column, so
// every date travels as a plain 'YYYY-MM-DD' string and is stored as UTC
// midnight — no timezone drift between mark and read.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const MONTH_RE = /^\d{4}-\d{2}$/

/** 'YYYY-MM-DD' → Date at UTC midnight (what Prisma expects for @db.Date). */
export function toDbDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

export function dbDateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** ISO weekday 1=Mon .. 7=Sun for a 'YYYY-MM-DD' string. */
export function isoWeekday(dateStr: string): number {
  const day = toDbDate(dateStr).getUTCDay() // 0=Sun .. 6=Sat
  return day === 0 ? 7 : day
}

export function isWorkingDay(dateStr: string, workingDays: number[]): boolean {
  return workingDays.includes(isoWeekday(dateStr))
}

/** 'YYYY-MM' → inclusive first day + exclusive first day of next month. */
export function monthRange(month: string): { from: Date; to: Date } {
  const [y, m] = month.split('-').map(Number)
  return {
    from: new Date(Date.UTC(y, m - 1, 1)),
    to: new Date(Date.UTC(y, m, 1))
  }
}
