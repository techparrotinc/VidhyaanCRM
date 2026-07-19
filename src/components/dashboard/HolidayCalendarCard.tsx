"use client"

// Month-view holiday calendar for the CRM dashboard (all roles) and the
// parent portal right rail. Fetches one month at a time from an endpoint
// that accepts ?from=YYYY-MM-DD&to=YYYY-MM-DD and returns { holidays }.

import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

type CalHoliday = {
  date: string // YYYY-MM-DD
  name: string
  source: string
  orgName?: string | null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_HEAD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] // Monday-first

function istToday(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** All-day ICS file from holiday rows — importable into Google/Apple Calendar. */
function buildIcs(holidays: CalHoliday[], year: number): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const events = holidays.map(h => {
    const d = h.date.replace(/-/g, '')
    const end = new Date(`${h.date}T00:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    const dEnd = end.toISOString().slice(0, 10).replace(/-/g, '')
    const summary = h.name.replace(/[\\;,]/g, ' ')
    return [
      'BEGIN:VEVENT',
      `UID:holiday-${d}-${summary.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@vidhyaan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${dEnd}`,
      `SUMMARY:${summary}${h.orgName ? ` (${h.orgName.replace(/[\\;,]/g, ' ')})` : ''}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    ].join('\r\n')
  })
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vidhyaan//Holiday Calendar//EN',
    `X-WR-CALNAME:Holidays ${year}`,
    ...events,
    'END:VCALENDAR'
  ].join('\r\n')
}

export function HolidayCalendarCard({
  endpoint,
  /** 'crm' matches dashboard cards (rounded-2xl); 'parent' matches the portal rail (rounded-3xl). */
  variant = 'crm'
}: {
  endpoint: string
  variant?: 'crm' | 'parent'
}) {
  const today = istToday()
  const [year, setYear] = useState(() => Number(today.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(today.slice(5, 7))) // 1-based
  const [cache, setCache] = useState<Record<string, CalHoliday[]>>({})
  const [exporting, setExporting] = useState(false)

  const exportIcs = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const sep = endpoint.includes('?') ? '&' : '?'
      const res = await fetch(`${endpoint}${sep}from=${year}-01-01&to=${year}-12-31`)
      const json = res.ok ? await res.json() : null
      const rows: CalHoliday[] = (json?.data ?? json)?.holidays ?? []
      const blob = new Blob([buildIcs(rows, year)], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `holidays-${year}.ics`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // non-fatal — button simply does nothing on failure
    } finally {
      setExporting(false)
    }
  }

  const monthKey = `${year}-${pad(month)}`
  const holidays = cache[monthKey]

  useEffect(() => {
    if (cache[monthKey]) return
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const sep = endpoint.includes('?') ? '&' : '?'
    let cancelled = false
    fetch(`${endpoint}${sep}from=${monthKey}-01&to=${monthKey}-${pad(lastDay)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (cancelled) return
        const payload = json?.data ?? json
        setCache(prev => ({ ...prev, [monthKey]: payload?.holidays ?? [] }))
      })
      .catch(() => {
        if (!cancelled) setCache(prev => ({ ...prev, [monthKey]: [] }))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, monthKey])

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1))
    setYear(d.getUTCFullYear())
    setMonth(d.getUTCMonth() + 1)
  }

  const byDate = useMemo(() => {
    const map = new Map<string, CalHoliday[]>()
    for (const h of holidays ?? []) {
      const list = map.get(h.date) ?? []
      list.push(h)
      map.set(h.date, list)
    }
    return map
  }, [holidays])

  // Monday-first offset for the 1st of the month
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const isParent = variant === 'parent'
  const cardCls = isParent
    ? 'rounded-3xl bg-white border border-slate-100 shadow-sm'
    : 'bg-white rounded-2xl border border-slate-200 shadow-sm'

  return (
    <section className={`${cardCls} p-5 md:p-6 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
            <CalendarDays size={15} strokeWidth={2} />
          </span>
          {isParent ? (
            <h3 className="text-base font-black text-slate-900">Holidays</h3>
          ) : (
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">HOLIDAY CALENDAR</h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={exportIcs}
            disabled={exporting}
            aria-label="Add to calendar (.ics)"
            title="Download .ics — import into Google or Apple Calendar"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition disabled:opacity-50 mr-1"
          >
            {exporting ? (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            ) : (
              <CalendarPlus size={14} strokeWidth={2} />
            )}
          </button>
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-[7.5rem] text-center tabular-nums">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={() => shift(1)}
            aria-label="Next month"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center select-none">
        {WEEKDAY_HEAD.map((d, i) => (
          <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const dateStr = `${monthKey}-${pad(day)}`
          const dayHolidays = byDate.get(dateStr)
          const isToday = dateStr === today
          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <span
                title={dayHolidays?.map(h => h.name).join(', ')}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] tabular-nums transition ${
                  dayHolidays
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : isToday
                      ? 'ring-2 ring-[#1565D8] text-[#1565D8] font-bold'
                      : 'text-slate-600 font-medium'
                }`}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Month holiday list */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex-1">
        {holidays === undefined ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-1">
            No holidays in {MONTHS_SHORT[month - 1]} {year}
          </p>
        ) : (
          <div className="space-y-2.5">
            {holidays.map(h => {
              const day = Number(h.date.slice(8, 10))
              const past = h.date < today
              return (
                <div key={`${h.date}-${h.name}`} className={`flex items-center gap-3 ${past ? 'opacity-50' : ''}`}>
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-orange-50 text-orange-600 text-[13px] font-bold flex items-center justify-center tabular-nums">
                    {day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                      {h.name}
                      {h.source === 'NATIONAL' && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-blue-50 text-[#1565D8] shrink-0">
                          National
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(`${h.date}T00:00:00Z`).toLocaleDateString('en-IN', {
                        weekday: 'long', timeZone: 'UTC'
                      })}
                      {h.orgName ? ` · ${h.orgName}` : ''}
                      {h.date === today ? ' · Today' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
