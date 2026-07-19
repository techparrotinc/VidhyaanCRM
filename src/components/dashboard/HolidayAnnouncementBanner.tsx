"use client"

// Groww-style holiday announcement strip for the CRM + parent dashboards.
// Shows the current or nearest holiday with a calendar date tile, countdown
// chip and an expandable "view upcoming" rail. Dismissal is per browser
// session (sessionStorage), so it reappears on every fresh login.

import React, { useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  CloudRain,
  Flag,
  Flame,
  Megaphone,
  Moon,
  Palette,
  PartyPopper,
  Sparkles,
  TreePine,
  Wheat,
  X,
  Zap,
  type LucideIcon
} from 'lucide-react'

type HolidayRange = {
  name: string
  source: string
  message?: string | null
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

// ---------------------------------------------------------------------------
// Festival-aware theming — keyword match on the holiday name
// ---------------------------------------------------------------------------
type Theme = {
  card: string
  glow: string
  band: string
  accent: string
  icon: LucideIcon
  /** false for closure notices — suppresses "enjoy the holiday!" phrasing */
  festive?: boolean
}

const THEMES: { match: RegExp; theme: Theme }[] = [
  {
    // Unexpected closures — weather. Checked before festival themes so
    // "Holiday due to rains" never renders festive.
    match: /rain|cyclone|flood|storm|weather|heavy showers|red alert/i,
    theme: {
      card: 'border-sky-200/90 bg-gradient-to-r from-sky-50 via-blue-50 to-slate-50',
      glow: 'bg-sky-200',
      band: 'bg-sky-600',
      accent: 'text-sky-700',
      icon: CloudRain,
      festive: false
    }
  },
  {
    // Unexpected closures — infrastructure / civic
    match: /electric|power|maintenance|repair|water supply|strike|bandh|curfew|protest|election|government/i,
    theme: {
      card: 'border-slate-200 bg-gradient-to-r from-slate-50 via-zinc-50 to-amber-50',
      glow: 'bg-amber-200',
      band: 'bg-slate-700',
      accent: 'text-slate-600',
      icon: Zap,
      festive: false
    }
  },
  {
    // Generic unplanned-closure wording without a specific cause
    match: /closed|closure|unexpected|emergency|announc|annouc|notice/i,
    theme: {
      card: 'border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-blue-50 to-white',
      glow: 'bg-indigo-200',
      band: 'bg-indigo-600',
      accent: 'text-indigo-700',
      icon: Megaphone,
      festive: false
    }
  },
  {
    // National days — saffron/green tricolor hint
    match: /republic|independence|gandhi/i,
    theme: {
      card: 'border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-emerald-50',
      glow: 'bg-orange-200',
      band: 'bg-orange-500',
      accent: 'text-orange-700',
      icon: Flag
    }
  },
  {
    match: /diwali|deepavali|dussehra|dasara|navratri/i,
    theme: {
      card: 'border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50',
      glow: 'bg-amber-300',
      band: 'bg-amber-500',
      accent: 'text-amber-700',
      icon: Flame
    }
  },
  {
    match: /holi/i,
    theme: {
      card: 'border-pink-200/80 bg-gradient-to-r from-pink-50 via-violet-50 to-sky-50',
      glow: 'bg-pink-200',
      band: 'bg-pink-500',
      accent: 'text-pink-700',
      icon: Palette
    }
  },
  {
    match: /eid|ramzan|ramadan|bakrid|muharram|milad/i,
    theme: {
      card: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50',
      glow: 'bg-emerald-200',
      band: 'bg-emerald-600',
      accent: 'text-emerald-700',
      icon: Moon
    }
  },
  {
    match: /christmas|x-?mas|new year/i,
    theme: {
      card: 'border-red-200/80 bg-gradient-to-r from-red-50 via-rose-50 to-emerald-50',
      glow: 'bg-red-200',
      band: 'bg-red-500',
      accent: 'text-red-700',
      icon: TreePine
    }
  },
  {
    match: /pongal|onam|makar|sankranti|baisakhi|harvest|ugadi|vishu/i,
    theme: {
      card: 'border-lime-200/80 bg-gradient-to-r from-amber-50 via-lime-50 to-emerald-50',
      glow: 'bg-lime-200',
      band: 'bg-lime-600',
      accent: 'text-lime-700',
      icon: Wheat
    }
  }
]

const DEFAULT_THEME: Theme = {
  card: 'border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50',
  glow: 'bg-amber-200',
  band: 'bg-orange-500',
  accent: 'text-orange-700',
  icon: Sparkles
}

/** Matches against name + greeting message — the closure cause often lives
 *  only in the message ("Holiday" + "due to heavy rains"). */
function themeFor(name: string, message?: string | null): Theme {
  const haystack = `${name} ${message ?? ''}`
  return THEMES.find(t => t.match.test(haystack))?.theme ?? DEFAULT_THEME
}

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
  const theme = themeFor(next.name, next.message)
  const ThemeIcon = theme.icon
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
      className={`relative overflow-hidden rounded-2xl border ${theme.card}`}
      role="status"
    >
      {/* decorative corner glow */}
      <div
        className={`pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full blur-2xl opacity-60 ${theme.glow}`}
      />
      <ThemeIcon
        size={72}
        strokeWidth={1}
        className={`pointer-events-none absolute -right-2 -bottom-5 opacity-[0.12] ${theme.accent}`}
      />

      <div className="relative flex items-center gap-4 p-4 pr-12 sm:px-5">
        {/* Calendar date tile */}
        <div className="shrink-0 w-14 rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden text-center">
          <div
            className={`text-[10px] font-bold uppercase tracking-widest text-white py-0.5 ${theme.band}`}
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
              {isToday && theme.festive !== false ? `${next.name} — enjoy the holiday!` : next.name}
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
            {next.message
              ? next.message
              : isToday
                ? 'Institution closed today'
                : 'Holiday'}
            {' · '}
            {rangeLabel(next)}
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
