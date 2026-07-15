import { startOfDay, endOfDay, parseISO, startOfISOWeek, endOfISOWeek, setISOWeek, setISOWeekYear } from 'date-fns'

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const WEEK_RE = /^\d{4}-W\d{2}$/

export function dayRange(dateStr: string): { gte: Date; lte: Date } {
  const d = parseISO(dateStr)
  return { gte: startOfDay(d), lte: endOfDay(d) }
}

export function isoWeekRange(weekStr: string): { gte: Date; lte: Date } {
  const [yearStr, weekPart] = weekStr.split('-W')
  const base = setISOWeek(setISOWeekYear(new Date(Number(yearStr), 0, 4), Number(yearStr)), Number(weekPart))
  return { gte: startOfISOWeek(base), lte: endOfISOWeek(base) }
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
