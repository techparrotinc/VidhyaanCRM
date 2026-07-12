"use client"

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { STATUS_META, type AttendanceStatusValue } from './StatusBadge'

export type CalendarRecord = {
  date: string // YYYY-MM-DD
  status: AttendanceStatusValue
  session?: {
    title: string | null
    course: { name: string } | null
    batch: { name: string } | null
  } | null
}

export type CalendarStats = {
  workingDays: number
  present: number
  absent: number
  halfDay: number
  leave: number
  percentage: number | null
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric', timeZone: 'UTC'
  })
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function AttendanceCalendar({
  month,
  records,
  stats,
  onMonthChange,
  loading
}: {
  month: string // YYYY-MM
  records: CalendarRecord[]
  stats: CalendarStats | null
  onMonthChange: (month: string) => void
  loading?: boolean
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarRecord[]>()
    for (const r of records) {
      const list = map.get(r.date) ?? []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [records])

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay() // 0=Sun
    const leading = (firstDow + 6) % 7 // Monday-first grid
    const list: ({ day: number; date: string } | null)[] = Array(leading).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ day: d, date: `${month}-${String(d).padStart(2, '0')}` })
    }
    return list
  }, [month])

  const statTiles = stats
    ? [
        { label: 'Attendance', value: stats.percentage != null ? `${stats.percentage}%` : '—' },
        { label: 'Present', value: String(stats.present) },
        { label: 'Absent', value: String(stats.absent) },
        { label: 'Half days', value: String(stats.halfDay) },
        { label: 'Leave', value: String(stats.leave) }
      ]
    : []

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statTiles.map(t => (
            <Card key={t.label}>
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t.label}</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{t.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{monthLabel(month)}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMonthChange(shiftMonth(month, -1))} disabled={loading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMonthChange(shiftMonth(month, 1))} disabled={loading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map(d => (
              <p key={d} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center py-1">
                {d}
              </p>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <div key={`pad-${i}`} />
              const dayRecords = byDay.get(cell.date) ?? []
              const single = dayRecords.length === 1 ? dayRecords[0] : null
              return (
                <div
                  key={cell.date}
                  title={dayRecords
                    .map(r => {
                      const ctx = r.session?.title || r.session?.course?.name || r.session?.batch?.name
                      return `${STATUS_META[r.status].label}${ctx ? ` — ${ctx}` : ''}`
                    })
                    .join('\n')}
                  className={`aspect-square rounded-lg border text-sm flex flex-col items-center justify-center gap-0.5 ${
                    single
                      ? `${STATUS_META[single.status].cell} text-white border-transparent font-semibold`
                      : 'bg-white border-slate-100 text-slate-700'
                  }`}
                >
                  <span>{cell.day}</span>
                  {dayRecords.length > 1 && (
                    <span className="flex gap-0.5">
                      {dayRecords.slice(0, 4).map((r, j) => (
                        <span key={j} className={`h-1.5 w-1.5 rounded-full ${STATUS_META[r.status].cell}`} />
                      ))}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            {(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY'] as AttendanceStatusValue[]).map(s => (
              <span key={s} className="flex items-center gap-1.5 text-xs font-normal text-slate-400">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[s].cell}`} />
                {STATUS_META[s].label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
