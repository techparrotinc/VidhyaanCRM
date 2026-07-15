'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Video, Users, Clock, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { institutionNoun, isLearningCentre } from '@/lib/institution'
import { SessionDrawer } from '@/components/schedule/SessionDrawer'
import type { ScheduleSession } from '@/components/schedule/types'

type DisplayStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

function displayStatus(s: ScheduleSession, now: Date): DisplayStatus {
  if (s.status === 'CANCELLED') return 'cancelled'
  const start = new Date(s.startsAt).getTime()
  const end = start + s.durationMin * 60_000
  const t = now.getTime()
  if (t < start) return 'upcoming'
  if (t < end) return 'ongoing'
  return 'completed'
}

const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const todayStr = () => localDateStr(new Date())

function isoWeekOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = (d.getDay() + 6) % 7 // Mon=0..Sun=6
  d.setDate(d.getDate() - day + 3) // nearest Thursday
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const diffDays = Math.round((d.getTime() - firstThursday.getTime()) / 86_400_000)
  const week = 1 + Math.round(diffDays / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export default function SchedulePage() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [date, setDate] = useState(todayStr())
  const [sessions, setSessions] = useState<ScheduleSession[] | null>(null)
  const [weekCounts, setWeekCounts] = useState<Record<string, { total: number; cancelled: number }> | null>(null)
  const [selected, setSelected] = useState<ScheduleSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [institutionType, setInstitutionType] = useState<string | null>(null)

  const selectedYearId = useAcademicYearStore(s => s.selectedYearId)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setInstitutionType(json?.data?.institutionType ?? null))
      .catch(() => setInstitutionType(null))
  }, [])

  const classNoun = isLearningCentre(institutionType) ? 'Batch' : institutionNoun(institutionType)

  const loadDay = useCallback(() => {
    const params = new URLSearchParams({ date })
    if (selectedYearId) params.set('academicYearId', selectedYearId)
    fetch(`/api/v1/schedule?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load schedule')
        setSessions(json.data.sessions)
      })
      .catch(err => setError(err.message))
  }, [date, selectedYearId])

  const loadWeek = useCallback(() => {
    const week = isoWeekOf(date)
    const params = new URLSearchParams({ week })
    if (selectedYearId) params.set('academicYearId', selectedYearId)
    fetch(`/api/v1/schedule?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load schedule')
        const counts: Record<string, { total: number; cancelled: number }> = {}
        for (const s of json.data.sessions as ScheduleSession[]) {
          const key = localDateStr(new Date(s.startsAt))
          if (!counts[key]) counts[key] = { total: 0, cancelled: 0 }
          counts[key].total++
          if (s.status === 'CANCELLED') counts[key].cancelled++
        }
        setWeekCounts(counts)
      })
      .catch(err => setError(err.message))
  }, [date, selectedYearId])

  useEffect(() => {
    setError(null)
    if (view === 'day') {
      setSessions(null)
      loadDay()
    } else {
      setWeekCounts(null)
      loadWeek()
    }
  }, [view, loadDay, loadWeek])

  const weekDays = useMemo(() => {
    const base = new Date(`${date}T00:00:00`)
    const dow = (base.getDay() + 6) % 7
    const monday = new Date(base)
    monday.setDate(base.getDate() - dow)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [date])

  const refresh = () => (view === 'day' ? loadDay() : loadWeek())

  const now = new Date()
  const today = todayStr()
  const quickDates = useMemo(() => {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return { yesterday: localDateStr(y), today, tomorrow: localDateStr(t) }
  }, [today])

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Schedule</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
            {classNoun} sessions — reschedule, cancel and remind guardians.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${view === 'day' ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${view === 'week' ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Week
            </button>
          </div>
          <div className="w-44">
            <DateTimePicker value={`${date}T00:00:00`} onChange={iso => iso && setDate(iso.slice(0, 10))} dateOnly clearable={false} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-12 flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
        {view === 'day' && (
          <div className="flex gap-2">
            {(['yesterday', 'today', 'tomorrow'] as const).map(k => (
              <button
                key={k}
                onClick={() => setDate(quickDates[k])}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  date === quickDates[k] ? 'bg-[#1565D8] text-white border-[#1565D8]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {view === 'day' ? (
          sessions === null ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">No sessions for this day</p>
              <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
                Sessions are generated automatically from each {classNoun.toLowerCase()}'s recurring schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <SessionCard key={s.id} session={s} now={now} onClick={() => setSelected(s)} />
              ))}
            </div>
          )
        ) : weekCounts === null ? (
          <div className="space-y-2">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {weekDays.map(d => {
              const key = localDateStr(d)
              const c = weekCounts[key] ?? { total: 0, cancelled: 0 }
              return (
                <button
                  key={key}
                  onClick={() => { setDate(key); setView('day') }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div>
                    <p className={`text-sm font-bold ${key === today ? 'text-[#1565D8]' : 'text-slate-900'}`}>
                      {d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs font-normal text-slate-400 mt-0.5">
                      {c.total} session{c.total === 1 ? '' : 's'}
                      {c.cancelled > 0 && ` · ${c.cancelled} cancelled`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <SessionDrawer
          session={selected}
          classNoun={classNoun}
          onClose={() => setSelected(null)}
          onChanged={() => {
            refresh()
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  upcoming: 'bg-slate-50 text-slate-600 border-slate-200',
  ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-[#1565D8] border-blue-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200'
}

function SessionCard({ session, now, onClick }: { session: ScheduleSession; now: Date; onClick: () => void }) {
  const status = displayStatus(session, now)
  const cancelled = status === 'cancelled'
  const label = session.course?.name || session.batch?.name || 'Session'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-5 transition-all hover:shadow-sm ${
        status === 'ongoing' ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-[#1565D8]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-bold truncate ${cancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {label}
          </p>
          <p className="text-xs font-normal text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <Clock className="h-3.5 w-3.5" />
            {new Date(session.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {session.durationMin} min
            </span>
            {session.teacher?.name && <span>· {session.teacher.name}</span>}
            {session.batch && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {session.batch.enrolledCount}
              </span>
            )}
            {session.meetingLink && <Video className="h-3.5 w-3.5 text-[#1565D8]" />}
          </p>
          {cancelled && session.cancelReason && (
            <p className="text-xs font-medium text-red-500 mt-1">Cancelled: {session.cancelReason}</p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 border ${STATUS_STYLES[status]}`}>
          {status === 'completed' && session.batch
            ? `${session.markedCount ?? 0}/${session.batch.enrolledCount} marked`
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </button>
  )
}
