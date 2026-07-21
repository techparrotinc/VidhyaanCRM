'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Video, Users, Clock, ChevronRight, Search, X, User, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/datetime-picker'
import { AppSelect } from '@/components/ui/app-select'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { institutionNoun, isLearningCentre } from '@/lib/institution'
import { SessionDrawer } from '@/components/schedule/SessionDrawer'
import type { ScheduleSession } from '@/components/schedule/types'

type Facet = { id: string; name: string | null }

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

  // Filters — essential once a centre has hundreds of students / many courses.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [facets, setFacets] = useState<{ courses: Facet[]; teachers: Facet[] }>({ courses: [], teachers: [] })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const selectedYearId = useAcademicYearStore(s => s.selectedYearId)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setInstitutionType(json?.data?.institutionType ?? null))
      .catch(() => setInstitutionType(null))
  }, [])

  const classNoun = isLearningCentre(institutionType) ? 'Batch' : institutionNoun(institutionType)

  const filterParams = useCallback(
    (base: Record<string, string>) => {
      const params = new URLSearchParams(base)
      if (selectedYearId) params.set('academicYearId', selectedYearId)
      if (courseId) params.set('courseId', courseId)
      if (teacherId) params.set('teacherId', teacherId)
      if (debouncedSearch) params.set('search', debouncedSearch)
      return params
    },
    [selectedYearId, courseId, teacherId, debouncedSearch]
  )

  const loadDay = useCallback(() => {
    fetch(`/api/v1/schedule?${filterParams({ date })}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load schedule')
        setSessions(json.data.sessions)
        if (json.data.facets) setFacets(json.data.facets)
      })
      .catch(err => setError(err.message))
  }, [date, filterParams])

  const loadWeek = useCallback(() => {
    const week = isoWeekOf(date)
    fetch(`/api/v1/schedule?${filterParams({ week })}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load schedule')
        if (json.data.facets) setFacets(json.data.facets)
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
  }, [date, filterParams])

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
            All sessions — reschedule, cancel and remind guardians.
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
            <DatePicker value={date} onChange={d => d && setDate(d)} clearable={false} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-12 flex-1 flex flex-col gap-4 max-w-5xl mx-auto w-full">
        {/* Filters — search a student/course, or scope to a course or teacher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student or course…"
              className="w-full h-10 pl-9 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
          <div className="w-44">
            <AppSelect
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="">All courses</option>
              {facets.courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </AppSelect>
          </div>
          <div className="w-44">
            <AppSelect
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="">All teachers</option>
              {facets.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name ?? 'Unnamed'}</option>
              ))}
            </AppSelect>
          </div>
          {(courseId || teacherId || search) && (
            <button
              onClick={() => { setCourseId(''); setTeacherId(''); setSearch('') }}
              className="h-10 px-3 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

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
  // School period → lead with subject + class/section. LC individual → lead with
  // the student; group class → lead with the group name. Course/scope secondary.
  const isPeriod = !!session.subject
  const isGroup = !!session.batch
  const title = isPeriod
    ? session.subject!
    : session.student?.name || session.batch?.name || session.course?.name || 'Session'
  const subtitle = isPeriod
    ? `${session.gradeLabel ?? ''}${session.section ? ` · ${session.section}` : ''}` || null
    : isGroup
      ? session.course?.name || 'Group class'
      : session.course?.name || null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
        status === 'ongoing' ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-[#1565D8]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full ${isPeriod ? 'bg-amber-50 text-amber-600' : isGroup ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-[#1565D8]'}`}>
              {isPeriod ? <BookOpen className="h-3.5 w-3.5" /> : isGroup ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </span>
            <p className={`text-sm font-bold truncate ${cancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {title}
            </p>
            {isGroup && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600">
                <Users className="h-3 w-3" />{session.batch!.enrolledCount}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs font-semibold mt-1 truncate ${cancelled ? 'text-slate-300' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
          <p className="text-xs font-normal text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <Clock className="h-3.5 w-3.5" />
            {new Date(session.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
              {session.durationMin} min
            </span>
            {session.teacher?.name && <span>· {session.teacher.name}</span>}
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
