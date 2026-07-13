'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Receipt,
  Sparkles
} from 'lucide-react'

type Ward = { id: string; name: string; gradeLabel: string | null; section: string | null; orgName: string }
type Item = {
  type: 'CLASS' | 'BATCH' | 'EVENT' | 'FEE_DUE'
  date: string
  startTime: string | null
  endTime: string | null
  title: string
  subtitle: string | null
  studentId: string | null
  studentName: string | null
  orgName: string | null
}
type Payload = { today: string; dates: string[]; wards: Ward[]; items: Item[] }

const ITEM_STYLE: Record<Item['type'], { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  CLASS: { bg: 'bg-blue-50 border-blue-100', text: 'text-[#1565D8]', dot: 'bg-[#1565D8]', icon: GraduationCap },
  BATCH: { bg: 'bg-violet-50 border-violet-100', text: 'text-violet-600', dot: 'bg-violet-500', icon: GraduationCap },
  EVENT: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CalendarDays },
  FEE_DUE: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600', dot: 'bg-amber-500', icon: Receipt }
}

const todayIst = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function ParentTimetablePage() {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [wardId, setWardId] = useState<string | 'ALL'>('ALL')
  const [view, setView] = useState<'week' | 'month'>('week')
  // week anchor = first day of the visible week; month anchor = YYYY-MM
  const [weekStart, setWeekStart] = useState(todayIst())
  const [monthAnchor, setMonthAnchor] = useState(todayIst().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState(todayIst())

  const load = useCallback(async (from: string, days: number) => {
    setFetching(true)
    try {
      const res = await fetch(`/api/v1/parent/timetable?from=${from}&days=${days}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'week') {
      load(weekStart, 7)
    } else {
      const [y, m] = monthAnchor.split('-').map(Number)
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
      load(`${monthAnchor}-01`, daysInMonth)
    }
  }, [view, weekStart, monthAnchor, load])

  const dayItems = useMemo(() => {
    if (!data) return []
    return data.items.filter((i) => {
      if (i.date !== selectedDate) return false
      if (wardId !== 'ALL' && i.studentId !== null && i.studentId !== wardId) return false
      return true
    })
  }, [data, selectedDate, wardId])

  const countFor = (date: string) =>
    data?.items.filter(
      (i) => i.date === date && (wardId === 'ALL' || i.studentId === null || i.studentId === wardId)
    ).length ?? 0

  const nowHHmm = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata'
  })
  const upNext =
    data?.items.find(
      (i) =>
        i.date === data.today &&
        i.startTime !== null &&
        i.startTime >= nowHHmm &&
        (wardId === 'ALL' || i.studentId === null || i.studentId === wardId)
    ) ?? null

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  if (!data || data.wards.length === 0) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900">Schedule</h1>
          <p className="text-sm font-semibold text-slate-400 mt-0.5">Your child&apos;s week at a glance</p>
        </div>
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-sm font-black text-slate-700">No schedule yet</h2>
          <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm mx-auto">
            Your child&apos;s class schedule appears here once their school links them to your account.
          </p>
        </div>
      </div>
    )
  }

  const monthLabel = new Date(`${monthAnchor}-01T00:00:00`).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric'
  })

  const shiftMonth = (n: number) => {
    const [y, m] = monthAnchor.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + n, 1))
    setMonthAnchor(d.toISOString().slice(0, 7))
  }

  // Month grid cells (Monday-first)
  const monthCells: (string | null)[] = []
  if (view === 'month') {
    const [y, m] = monthAnchor.split('-').map(Number)
    const firstDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
    for (let i = 0; i < firstDow; i++) monthCells.push(null)
    for (let d = 1; d <= daysInMonth; d++) monthCells.push(`${monthAnchor}-${String(d).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900">Schedule</h1>
          <p className="text-sm font-semibold text-slate-400 mt-0.5">Your child&apos;s week at a glance</p>
        </div>
        <div className="flex rounded-2xl border border-slate-200 bg-white p-0.5 self-start">
          {(['week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v)
                if (v === 'week') {
                  setWeekStart(todayIst())
                  setSelectedDate(todayIst())
                } else {
                  setMonthAnchor(selectedDate.slice(0, 7))
                }
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                view === v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
      <div className="lg:col-span-2 space-y-6">

      {/* ===== WEEK VIEW: nav + day strip ===== */}
      {view === 'week' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const s = addDays(weekStart, -7)
              setWeekStart(s)
              setSelectedDate(s)
            }}
            className="shrink-0 w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1565D8] hover:border-blue-200 transition cursor-pointer shadow-sm"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x flex-1">
            {data.dates.map((date) => {
              const d = new Date(`${date}T00:00:00`)
              const isToday = date === data.today
              const active = date === selectedDate
              const n = countFor(date)
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`shrink-0 snap-start w-[64px] rounded-2xl py-2.5 flex flex-col items-center gap-0.5 border transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 shadow-sm'
                  } ${isToday && !active ? 'ring-2 ring-blue-100' : ''}`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'text-slate-400' : 'text-slate-300'}`}>
                    {isToday ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-black leading-none">{d.getDate()}</span>
                  <span className={`mt-1 h-1.5 rounded-full transition-all ${
                    n > 0 ? (active ? 'w-4 bg-white/70' : 'w-4 bg-[#1565D8]/50') : 'w-1.5 bg-slate-100'
                  }`} />
                </button>
              )
            })}
          </div>

          <button
            onClick={() => {
              const s = addDays(weekStart, 7)
              setWeekStart(s)
              setSelectedDate(s)
            }}
            className="shrink-0 w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1565D8] hover:border-blue-200 transition cursor-pointer shadow-sm"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== MONTH VIEW: calendar grid ===== */}
      {view === 'month' && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-slate-900">{monthLabel}</p>
            <div className="flex gap-1.5">
              <button onClick={() => shiftMonth(-1)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1565D8] cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => shiftMonth(1)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1565D8] cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <p key={d} className="text-[10px] font-black uppercase tracking-wider text-slate-300 text-center py-1">{d}</p>
            ))}
            {monthCells.map((date, i) => {
              if (!date) return <div key={`pad-${i}`} />
              const n = countFor(date)
              const active = date === selectedDate
              const isToday = date === data.today
              const types = [...new Set(
                (data.items.filter((it) => it.date === date && (wardId === 'ALL' || it.studentId === null || it.studentId === wardId)) ?? [])
                  .map((it) => it.type)
              )].slice(0, 3)
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-xl border text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white font-black'
                      : isToday
                        ? 'bg-blue-50 border-blue-100 text-[#1565D8] font-black'
                        : 'bg-white border-slate-100 text-slate-600 font-semibold hover:border-slate-200'
                  }`}
                >
                  {new Date(`${date}T00:00:00`).getDate()}
                  <span className="flex gap-0.5 h-1.5">
                    {n > 0 && types.map((t) => (
                      <span key={t} className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : ITEM_STYLE[t].dot}`} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Ward filter */}
      {data.wards.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setWardId('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
              wardId === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            All
          </button>
          {data.wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setWardId(w.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                wardId === w.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {w.name.split(' ')[0]} · {w.gradeLabel ?? ''}
            </button>
          ))}
        </div>
      )}

      {/* Selected-day header (month view) */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-black text-slate-900">
          {selectedDate === data.today
            ? 'Today'
            : new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
        </h3>
        {fetching && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
      </div>

      {/* Timeline */}
      {dayItems.length > 0 ? (
        <div className="relative space-y-3 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-px before:bg-slate-200">
          {dayItems.map((item, idx) => {
            const s = ITEM_STYLE[item.type]
            const Icon = s.icon
            return (
              <div key={idx} className="relative flex items-center gap-3.5">
                <div className={`relative z-10 w-[54px] h-[54px] rounded-2xl border ${s.bg} ${s.text} flex flex-col items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[9px] font-black mt-0.5">{item.startTime ?? 'DAY'}</span>
                </div>
                <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                    {[
                      item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : null,
                      item.studentName,
                      item.subtitle ?? item.orgName
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-black text-slate-500">
            {selectedDate === data.today ? 'Free day — nothing scheduled today' : 'Nothing scheduled this day'}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">Classes, events and fee due dates show up here.</p>
        </div>
      )}
      </div>

      {/* ===== RIGHT RAIL ===== */}
      <div className="space-y-6">
        {/* Up next */}
        <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Up next today</p>
          {upNext ? (
            <>
              <p className="text-xl font-black tracking-tight mt-1.5">{upNext.title}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {[
                  upNext.startTime && `${upNext.startTime}${upNext.endTime ? `–${upNext.endTime}` : ''}`,
                  upNext.studentName,
                  upNext.subtitle ?? upNext.orgName
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-slate-300 mt-1.5">Nothing more scheduled today</p>
          )}
        </div>

        {/* Period overview */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {view === 'week' ? 'This week' : monthLabel}
          </p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {data.dates.filter((d) => view === 'week' || countFor(d) > 0).map((date) => {
              const d = new Date(`${date}T00:00:00`)
              const n = countFor(date)
              const active = date === selectedDate
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition cursor-pointer ${
                    active ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-bold ${active ? 'text-[#1565D8]' : 'text-slate-600'}`}>
                    {date === data.today ? 'Today' : d.toLocaleDateString('en-IN', { weekday: view === 'week' ? 'long' : 'short' })}
                    <span className="text-slate-300 font-semibold ml-1.5">
                      {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${
                    n > 0 ? 'bg-blue-50 text-[#1565D8]' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {n > 0 ? `${n} item${n > 1 ? 's' : ''}` : 'Free'}
                  </span>
                </button>
              )
            })}
            {view === 'month' && data.dates.every((d) => countFor(d) === 0) && (
              <p className="text-xs text-slate-300 font-semibold text-center py-4">Nothing this month</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Legend</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1565D8]" /> Class</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Batch</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Event</span>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Fee due</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
