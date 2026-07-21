'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarOff, CheckCircle2, Circle, Plus, School, Trash2, Users, Video } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/datetime-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { isLearningCentre } from '@/lib/institution'
import { RegisterGrid, type RosterStudent, type ExistingMark } from '@/components/attendance/RegisterGrid'
import { SessionFormDialog } from '@/components/attendance/SessionFormDialog'
import type { AttendanceStatusValue } from '@/components/attendance/StatusBadge'

type ClassCard = {
  gradeLabel: string
  section: string | null
  students: number
  marked: number
  present: number
  absent: number
}

type SessionRow = {
  id: string
  title: string | null
  deliveryMode: string
  startsAt: string | null
  course: { id: string; name: string } | null
  batch: { id: string; name: string } | null
  gradeLabel: string | null
  section: string | null
  subject: string | null
  _count: { records: number }
}

type Target =
  | { kind: 'class'; gradeLabel: string; section: string | null; label: string }
  | { kind: 'session'; sessionId: string; label: string }

const todayStr = () => {
  const now = new Date()
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}

const fmtDay = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  })

export default function AttendancePage() {
  const confirm = useConfirm()
  const [mode, setMode] = useState<'school' | 'lc' | null>(null)
  // Schools can mark once-a-day (by class) or per-period (from the timetable).
  const [schoolTab, setSchoolTab] = useState<'daily' | 'periods'>('daily')
  const [date, setDate] = useState(todayStr())
  const [target, setTarget] = useState<Target | null>(null)

  // Overview data
  const [classes, setClasses] = useState<ClassCard[] | null>(null)
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [holiday, setHoliday] = useState<{ name: string } | null>(null)
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  // Long-weekend nudge: name of a holiday on the adjacent day (yesterday or
  // tomorrow), so staff expect extra absences around it.
  const [adjacentHoliday, setAdjacentHoliday] = useState<string | null>(null)

  useEffect(() => {
    setAdjacentHoliday(null)
    const shiftDay = (d: string, delta: number) => {
      const t = new Date(`${d}T00:00:00.000Z`)
      t.setUTCDate(t.getUTCDate() + delta)
      return t.toISOString().slice(0, 10)
    }
    const prev = shiftDay(date, -1)
    const next = shiftDay(date, 1)
    fetch(`/api/v1/holidays?from=${prev}&to=${next}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const rows: { date: string; name: string }[] = json?.data?.holidays ?? []
        const adj = rows.find(h => h.date !== date)
        setAdjacentHoliday(adj ? adj.name : null)
      })
      .catch(() => {})
  }, [date])
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)

  // Register data
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [marks, setMarks] = useState<ExistingMark[]>([])
  const [registerLoading, setRegisterLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setMode(isLearningCentre(json?.data?.institutionType) ? 'lc' : 'school'))
      .catch(() => setMode('school'))
  }, [])

  // ── Overview ──
  const loadOverview = useCallback(() => {
    if (mode === 'school' && schoolTab === 'daily') {
      fetch(`/api/v1/attendance/overview?date=${date}`)
        .then(r => r.json())
        .then(json => {
          if (!json.success) throw new Error(json.error || 'Failed to load')
          setClasses(json.data.classes)
          setHoliday(json.data.holiday)
          setIsWorkingDay(json.data.isWorkingDay)
        })
        .catch(err => setError(err.message))
    } else if (mode === 'lc' || (mode === 'school' && schoolTab === 'periods')) {
      // LC sessions, or school timetable periods for the day.
      fetch(`/api/v1/attendance/sessions?date=${date}`)
        .then(r => r.json())
        .then(json => setSessions(json?.data?.sessions ?? []))
        .catch(() => setSessions([]))
    }
  }, [mode, schoolTab, date])

  useEffect(() => {
    setClasses(null)
    setSessions(null)
    setError(null)
    loadOverview()
  }, [loadOverview])

  // Date change invalidates the open register
  useEffect(() => setTarget(null), [date])

  // ── Register ──
  const loadRegister = useCallback(() => {
    if (!target) return
    const params = new URLSearchParams({ date })
    if (target.kind === 'class') {
      params.set('gradeLabel', target.gradeLabel)
      if (target.section) params.set('section', target.section)
      else params.set('unsectioned', 'true')
    } else {
      params.set('sessionId', target.sessionId)
    }
    setRegisterLoading(true)
    setError(null)
    fetch(`/api/v1/attendance/register?${params}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load register')
        setRoster(json.data.roster)
        setMarks(json.data.marks)
        setHoliday(json.data.holiday)
        setIsWorkingDay(json.data.isWorkingDay)
      })
      .catch(err => setError(err.message))
      .finally(() => setRegisterLoading(false))
  }, [target, date])

  useEffect(() => {
    setRoster([])
    setMarks([])
    loadRegister()
  }, [loadRegister])

  const handleSave = async (
    entries: { studentId: string; status: AttendanceStatusValue; note?: string }[]
  ) => {
    if (!target) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/attendance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          sessionId: target.kind === 'session' ? target.sessionId : undefined,
          entries
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save attendance')
      loadRegister()
      loadOverview()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (session: SessionRow) => {
    const okToDelete = await confirm({
      title: 'Delete session?',
      message: 'All attendance marked for this session will be removed.',
      confirmLabel: 'Delete'
    })
    if (!okToDelete) return
    await fetch(`/api/v1/attendance/sessions/${session.id}`, { method: 'DELETE' })
    if (target?.kind === 'session' && target.sessionId === session.id) setTarget(null)
    loadOverview()
  }

  const isPastDay = date < todayStr()
  const blocked = !!holiday

  // ── Shell ──
  if (mode === null) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="px-4 sm:px-6 pb-12 max-w-6xl mx-auto w-full grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 pt-6 pb-4">
        <div className="flex-1 min-w-[200px]">
          {target ? (
            <button
              onClick={() => setTarget(null)}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#1565D8] hover:underline mb-1"
            >
              <ArrowLeft className="h-4 w-4" />
              All {mode === 'school' ? (schoolTab === 'daily' ? 'classes' : 'periods') : 'sessions'}
            </button>
          ) : null}
          <h1 className="text-xl font-bold text-slate-900 truncate">
            {target ? target.label : 'Attendance'}
          </h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
            {fmtDay(date)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mode === 'school' && !target && (
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['daily', 'periods'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSchoolTab(t)}
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${
                    schoolTab === t ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'daily' ? 'Daily' : 'Periods'}
                </button>
              ))}
            </div>
          )}
          <div className="w-44 sm:w-52">
            <DatePicker
              value={date}
              onChange={d => d && setDate(d)}
              clearable={false}
            />
          </div>
          {mode === 'lc' && !target && (
            <button
              onClick={() => setSessionDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-4 sm:px-6 pb-12 flex-1 flex flex-col gap-4 max-w-6xl mx-auto w-full">
        {/* Day banners */}
        {blocked && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <CalendarOff className="h-5 w-5 text-slate-400 shrink-0" />
            <p className="text-sm font-medium text-slate-600">
              {holiday!.name} — this day is a holiday. Attendance is not marked on holidays.
            </p>
          </div>
        )}
        {!blocked && adjacentHoliday && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <CalendarOff className="h-5 w-5 text-blue-400 shrink-0" />
            <p className="text-sm font-medium text-blue-700">
              Adjacent to a holiday ({adjacentHoliday}) — expect higher absences today.
            </p>
          </div>
        )}
        {!blocked && !isWorkingDay && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <CalendarOff className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-700">
              Not a configured working day. You can still mark attendance if a class was held.
            </p>
          </div>
        )}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {/* ── REGISTER VIEW ── */}
        {target ? (
          registerLoading && roster.length === 0 ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <RegisterGrid
              roster={roster}
              marks={marks}
              disabled={blocked}
              isPastDay={isPastDay}
              onSave={handleSave}
              saving={saving}
            />
          )
        ) : mode === 'school' && schoolTab === 'daily' ? (
          /* ── SCHOOL OVERVIEW: one card per class-section ── */
          classes === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <School className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No classes to show</p>
              <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1 max-w-sm mx-auto">
                Classes appear here from your student records. Add active students with a class
                assigned — or, if you are a teacher, ask your admin to assign classes to you.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map(c => {
                const label = `${c.gradeLabel}${c.section ? ` — ${c.section}` : ''}`
                const done = c.marked >= c.students && c.students > 0
                const pct = c.students > 0 ? Math.round((c.marked / c.students) * 100) : 0
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setTarget({ kind: 'class', gradeLabel: c.gradeLabel, section: c.section, label })
                    }
                    className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#1565D8]/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-[#1565D8] transition-colors">
                        {label}
                      </p>
                      {blocked ? (
                        <span className="text-[11px] font-semibold text-slate-400">Holiday</span>
                      ) : done ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Marked
                        </span>
                      ) : c.marked > 0 ? (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          {c.marked}/{c.students}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                          <Circle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-normal text-slate-400 mt-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {c.students} student{c.students === 1 ? '' : 's'}
                      {c.marked > 0 && !blocked && (
                        <span className="ml-1">· {c.present} present · {c.absent} absent</span>
                      )}
                    </p>

                    {/* progress bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-[#1565D8]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          /* ── SESSION OVERVIEW: LC sessions or school timetable periods ── */
          sessions === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">No {mode === 'school' ? 'periods' : 'sessions'} for this day</p>
              <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
                {mode === 'school'
                  ? 'Periods appear here from the class timetable. Add periods in Timetable, or use Daily to mark once a day.'
                  : 'Create a session for a course or batch to start marking attendance.'}
              </p>
              {mode === 'lc' && (
                <button
                  onClick={() => setSessionDialogOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Session
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map(s => {
                const isPeriod = !!s.gradeLabel
                const label = isPeriod
                  ? s.subject || 'Period'
                  : s.title || s.course?.name || s.batch?.name || 'Session'
                const scope = isPeriod
                  ? `${s.gradeLabel}${s.section ? ` · ${s.section}` : ''}`
                  : (s.title ? (s.course?.name || s.batch?.name) : null)
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setTarget({ kind: 'session', sessionId: s.id, label: scope ? `${label} · ${scope}` : label })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setTarget({ kind: 'session', sessionId: s.id, label: scope ? `${label} · ${scope}` : label })
                    }}
                    className="cursor-pointer text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#1565D8]/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#1565D8] transition-colors">
                        {label}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {s._count.records > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            {s._count.records} marked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                            <Circle className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {/* Only ad-hoc LC sessions can be deleted; timetable periods are managed in Timetable */}
                        {!isPeriod && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleDeleteSession(s) }}
                            className="text-slate-300 hover:text-red-500"
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-normal text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      {scope && <span>{scope}</span>}
                      {s.deliveryMode === 'ONLINE' && (
                        <span className="inline-flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" /> Online
                        </span>
                      )}
                      {s.startsAt &&
                        new Date(s.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      <SessionFormDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        date={date}
        onCreated={loadOverview}
      />
    </div>
  )
}
