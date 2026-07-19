"use client"

// Groww-style holiday announcement strip for the CRM + parent dashboards.
// Shows the current or nearest holiday with a calendar date tile, countdown
// chip and an expandable "view upcoming" rail. Dismissal is per browser
// session (sessionStorage), so it reappears on every fresh login.

import React, { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, PartyPopper, Sparkles, X } from 'lucide-react'

type HolidayRange = {
  name: string
  source: string
  startDate: string
  endDate: string
  orgName?: string | null
}

type NextHoliday = HolidayRange & { daysUntil: number }

type Payload = {
  next: NextHoliday | null
  upcoming: HolidayRange[]
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parts(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  return {
    day: d.getUTCDate(),
    month: MONTHS_SHORT[d.getUTCMonth()],
    weekday: WEEKDAYS[d.getUTCDay()]
  }
}

function rangeLabel(h: HolidayRange): string {
  const s = parts(h.startDate)
  if (h.startDate === h.endDate) return `${s.weekday}, ${s.day} ${s.month}`
  const e = parts(h.endDate)
  return `${s.day} ${s.month} – ${e.day} ${e.month}`
}

function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

export function HolidayAnnouncementBanner({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [dismissed, setDismissed] = useState(true) // stay hidden until checked
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(endpoint)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (cancelled || !json) return
        // route() responses wrap in { data }, parent route returns flat
        const payload: Payload = json.data ?? json
        if (!payload?.next) return
        setData(payload)
        try {
          setDismissed(
            sessionStorage.getItem(`holiday-banner:${payload.next.startDate}`) === '1'
          )
        } catch {
          setDismissed(false)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [endpoint])

  if (!data?.next || dismissed) return null

  const next = data.next
  const isToday = next.daysUntil === 0
  const start = parts(next.startDate)
  const others = data.upcoming.filter(
    h => !(h.startDate === next.startDate && h.name === next.name)
  )

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(`holiday-banner:${next.startDate}`, '1')
    } catch {}
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        isToday
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50'
          : 'border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50'
      }`}
      role="status"
    >
      {/* decorative corner glow */}
      <div
        className={`pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full blur-2xl opacity-60 ${
          isToday ? 'bg-emerald-200' : 'bg-amber-200'
        }`}
      />
      <Sparkles
        size={72}
        strokeWidth={1}
        className={`pointer-events-none absolute -right-2 -bottom-5 opacity-[0.12] ${
          isToday ? 'text-emerald-700' : 'text-orange-700'
        }`}
      />

      <div className="relative flex items-center gap-4 p-4 pr-12 sm:px-5">
        {/* Calendar date tile */}
        <div className="shrink-0 w-14 rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden text-center">
          <div
            className={`text-[10px] font-bold uppercase tracking-widest text-white py-0.5 ${
              isToday ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
          >
            {start.month}
          </div>
          <div className="text-[22px] font-bold text-slate-900 leading-tight py-1">
            {start.day}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900 truncate">
              {isToday ? `${next.name} — enjoy the holiday!` : next.name}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isToday
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isToday ? <PartyPopper size={11} strokeWidth={2} /> : <CalendarDays size={11} strokeWidth={2} />}
              {countdownLabel(next.daysUntil)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {isToday ? 'Institution closed today' : 'Holiday'} · {rangeLabel(next)}
            {next.orgName ? ` · ${next.orgName}` : ''}
          </p>
        </div>

        {others.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition shrink-0"
          >
            Upcoming
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss holiday announcement"
        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 transition"
      >
        <X size={16} strokeWidth={2} />
      </button>

      {expanded && others.length > 0 && (
        <div className="relative border-t border-white/70 px-4 sm:px-5 py-3 flex gap-2 overflow-x-auto">
          {others.map(h => {
            const p = parts(h.startDate)
            return (
              <div
                key={`${h.startDate}-${h.name}`}
                className="shrink-0 flex items-center gap-2.5 bg-white/80 border border-slate-100 rounded-xl px-3 py-2"
              >
                <div className="text-center leading-none">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-orange-600">
                    {p.month}
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{p.day}</div>
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {h.name}
                  </div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">
                    {rangeLabel(h)}
                    {h.orgName ? ` · ${h.orgName}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
