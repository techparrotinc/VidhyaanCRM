"use client"

import * as React from 'react'
import { CalendarDays, Clock, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'

/**
 * Branded date+time picker (replaces native datetime-local inputs).
 * Value in/out is an ISO string ('' when empty).
 */
type DateTimePickerProps = {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  /** hide the time selector (all-day events, DOB fields) */
  dateOnly?: boolean
  minDate?: Date
  maxDate?: Date
  clearable?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function formatDisplay(date: Date, dateOnly: boolean) {
  const d = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (dateOnly) return d
  const t = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${d} · ${t}`
}

// 15-minute steps across the day
const TIME_OPTIONS: { value: string; label: string }[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const label = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    TIME_OPTIONS.push({ value: `${pad(h)}:${pad(m)}`, label })
  }
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date & time',
  dateOnly = false,
  minDate,
  maxDate,
  clearable = true
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const timeListRef = React.useRef<HTMLDivElement | null>(null)
  const current = value ? new Date(value) : null

  const timeValue = current ? `${pad(current.getHours())}:${pad(current.getMinutes())}` : '09:00'

  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  // Scroll the time column to the selected (or 9 AM) slot on open
  React.useEffect(() => {
    if (!open || dateOnly) return
    const el = timeListRef.current?.querySelector('[data-active="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'center' })
  }, [open, dateOnly])

  const emit = (date: Date, time: string) => {
    const [h, m] = time.split(':').map(Number)
    const next = new Date(date)
    next.setHours(h, m, 0, 0)
    onChange(next.toISOString())
  }

  const isPastDisabled = (d: Date) =>
    (!!minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) ||
    (!!maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59))

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-left focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 cursor-pointer hover:border-slate-300 transition-colors"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
        <span className={`flex-1 truncate ${current ? 'text-slate-800' : 'text-slate-400'}`}>
          {current ? formatDisplay(current, dateOnly) : placeholder}
        </span>
        {clearable && current && (
          <span
            role="button"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="p-0.5 rounded text-slate-300 hover:text-slate-500"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-[60] flex bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={current ?? undefined}
              onSelect={(d: Date) => {
                if (isPastDisabled(d)) return
                emit(d, dateOnly ? '00:00' : timeValue)
                if (dateOnly) setOpen(false)
              }}
            />
          </div>
          {!dateOnly && (
            <div className="w-28 border-l border-slate-100 flex flex-col">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time</span>
              </div>
              <div ref={timeListRef} className="overflow-y-auto max-h-64 py-1">
                {TIME_OPTIONS.map((t) => {
                  const active = timeValue === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      data-active={active}
                      onClick={() => {
                        emit(current ?? new Date(), t.value)
                        setOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                        active && current
                          ? 'bg-[#1565D8] text-white font-semibold'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-[#1565D8]'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Date-only variant for forms that store 'YYYY-MM-DD' strings — the branded
 * replacement for native <input type="date"> (same look as the follow-up
 * picker). Converts at the boundary with LOCAL date parts so the calendar
 * day never shifts across timezones.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  clearable = true
}: {
  value: string
  onChange: (ymd: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  clearable?: boolean
}) {
  const iso = value ? new Date(`${value}T00:00:00`).toISOString() : ''
  return (
    <DateTimePicker
      dateOnly
      value={iso}
      onChange={(v) => {
        if (!v) {
          onChange('')
          return
        }
        const d = new Date(v)
        onChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
      }}
      placeholder={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      clearable={clearable}
    />
  )
}
