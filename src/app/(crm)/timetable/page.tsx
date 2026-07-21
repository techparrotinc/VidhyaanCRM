'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  CalendarClock, MapPin, Pencil, Plus, Trash2, User, GraduationCap, Layers,
  ChevronLeft, ChevronRight, ArrowLeftRight, Ban, RotateCcw, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { AppSelect } from '@/components/ui/app-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ClassOption = { name: string; sections: string[]; legacy: boolean }
type Teacher = { id: string; name: string; role: string }
type Slot = {
  id: string
  gradeLabel: string
  section: string | null
  sectionKey: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  room: string | null
  teacher: { id: string; name: string } | null
  teacherId: string | null
  cancelledAt: string | null
  cancelReason: string | null
  canManage: boolean
  dateCancelled: { date: string; reason: string | null } | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const emptyForm = {
  id: null as string | null,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '09:45',
  subject: '',
  teacherId: '',
  room: '',
  wholeClass: false
}

const localISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const dow = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - dow)
  return localISO(d)
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localISO(d)
}

/** ISO date of a slot's occurrence within the selected week. */
function slotDate(weekStart: string, dayOfWeek: number): string {
  return addDays(weekStart, dayOfWeek - 1)
}

type PeriodStatus = 'past' | 'current' | 'upcoming'

/** Time-of-week status of a period relative to `now` (past / current / upcoming). */
function periodStatus(
  slot: { dayOfWeek: number; startTime: string; endTime: string },
  weekStart: string,
  now: Date
): PeriodStatus {
  const dateISO = slotDate(weekStart, slot.dayOfWeek)
  const start = new Date(`${dateISO}T${slot.startTime}:00`).getTime()
  const end = new Date(`${dateISO}T${slot.endTime}:00`).getTime()
  const t = now.getTime()
  if (t >= end) return 'past'
  if (t >= start) return 'current'
  return 'upcoming'
}

export default function TimetablePage() {
  const confirm = useConfirm()
  const { data: session } = useSession()
  const myId = (session?.user as any)?.id as string | undefined
  const myRole = (session?.user as any)?.role as string | undefined

  const [options, setOptions] = useState<ClassOption[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isAdmin, setIsAdmin] = useState(true)

  const [view, setView] = useState<'class' | 'teacher'>('class')
  const [gradeLabel, setGradeLabel] = useState('')
  const [section, setSection] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [weekStart, setWeekStart] = useState(mondayOf(localISO(new Date())))

  const [slots, setSlots] = useState<Slot[]>([])
  const [subjectOptions, setSubjectOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [sheet, setSheet] = useState<Slot | null>(null)
  const [swapSource, setSwapSource] = useState<Slot | null>(null)

  // Live clock so period colouring (past / now / next) stays accurate.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [optRes, usersRes, subjRes] = await Promise.all([
          fetch('/api/v1/options/classes'),
          fetch('/api/v1/users'),
          fetch('/api/v1/options/subjects')
        ])
        const optJson = await optRes.json()
        const list: ClassOption[] = optJson?.data?.options ?? optJson?.options ?? []
        setOptions(list)
        const subjJson = await subjRes.json().catch(() => null)
        setSubjectOptions((subjJson?.data?.options ?? []).map((o: { name: string }) => o.name))
        if (list.length > 0) {
          setGradeLabel(list[0].name)
          setSection(list[0].sections[0] ?? '')
        }
        if (usersRes.ok) {
          const usersJson = await usersRes.json()
          const users: Teacher[] = (usersJson?.data ?? []).filter((u: Teacher) => u.role === 'TEACHER')
          setTeachers(users)
        } else {
          // Teachers list is admin-only; a TEACHER still gets read + own-slot edit.
          setIsAdmin(false)
          setView('teacher')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fetchSlots = useCallback(async () => {
    const params = new URLSearchParams({ weekStart })
    if (view === 'teacher') {
      if (teacherId) params.set('teacherId', teacherId)
      // a TEACHER with no explicit pick → API defaults to their own timetable
      else if (isAdmin) return setSlots([])
    } else {
      if (!gradeLabel) return
      params.set('gradeLabel', gradeLabel)
      if (section) params.set('section', section)
    }
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/v1/timetable?${params}`)
      const json = await res.json()
      setSlots(json?.data?.slots ?? [])
    } finally {
      setSlotsLoading(false)
    }
  }, [view, gradeLabel, section, teacherId, weekStart, isAdmin])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const sectionsForClass = useMemo(
    () => options.find((o) => o.name === gradeLabel)?.sections ?? [],
    [options, gradeLabel]
  )

  // Distinct time rows (period start–end) across the loaded slots, ascending.
  const timeRows = useMemo(() => {
    const m = new Map<string, { startTime: string; endTime: string }>()
    for (const s of slots) m.set(`${s.startTime}-${s.endTime}`, { startTime: s.startTime, endTime: s.endTime })
    return [...m.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [slots])

  // (dayOfWeek | start-end) → slots in that cell (teacher view can stack classes).
  const cellMap = useMemo(() => {
    const m = new Map<string, Slot[]>()
    for (const s of slots) {
      const k = `${s.dayOfWeek}|${s.startTime}-${s.endTime}`
      const arr = m.get(k) ?? []
      arr.push(s)
      m.set(k, arr)
    }
    return m
  }, [slots])

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    const f = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return `${f(weekStart)} – ${f(end)}`
  }, [weekStart])

  const canAddHere = isAdmin && view === 'class'

  // The single "next" period — soonest upcoming, non-cancelled — gets its own accent.
  const nextSlotId = useMemo(() => {
    let bestId: string | null = null
    let bestStart = Infinity
    for (const s of slots) {
      if (s.cancelledAt || s.dateCancelled) continue
      if (periodStatus(s, weekStart, now) !== 'upcoming') continue
      const start = new Date(`${slotDate(weekStart, s.dayOfWeek)}T${s.startTime}:00`).getTime()
      if (start < bestStart) { bestStart = start; bestId = s.id }
    }
    return bestId
  }, [slots, weekStart, now])

  const openCreate = (dayOfWeek: number, startTime?: string, endTime?: string) => {
    setForm({
      ...emptyForm,
      dayOfWeek,
      startTime: startTime ?? emptyForm.startTime,
      endTime: endTime ?? emptyForm.endTime,
      wholeClass: !section
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (slot: Slot) => {
    setSheet(null)
    setForm({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject,
      teacherId: slot.teacher?.id ?? '',
      room: slot.room ?? '',
      wholeClass: slot.sectionKey === 'ALL'
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.subject.trim()) return setFormError('Subject is required')
    setSaving(true)
    setFormError(null)
    try {
      // Editing keeps the slot's own class/section; creating uses the picker.
      const editing = slots.find((s) => s.id === form.id)
      const payload = {
        gradeLabel: editing?.gradeLabel ?? gradeLabel,
        section: form.wholeClass ? null : (editing ? editing.section : section) || null,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        subject: form.subject.trim(),
        teacherId: form.teacherId || null,
        room: form.room.trim() || null
      }
      const res = await fetch(form.id ? `/api/v1/timetable/${form.id}` : '/api/v1/timetable', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) {
        const details = json?.error?.details
        const first = details && typeof details === 'object' ? Object.values(details).flat()[0] : null
        return setFormError((first as string) || json?.error?.message || 'Failed to save period')
      }
      setDialogOpen(false)
      fetchSlots()
    } finally {
      setSaving(false)
    }
  }

  const cancelPeriod = async (slot: Slot, scope: 'recurring' | 'date', restore = false) => {
    const body: any = { scope, restore }
    if (scope === 'date') body.date = slotDate(weekStart, slot.dayOfWeek)
    await fetch(`/api/v1/timetable/${slot.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setSheet(null)
    fetchSlots()
  }

  const remove = async (slot: Slot) => {
    setSheet(null)
    const okDelete = await confirm({
      title: 'Delete this period?',
      message: `${slot.subject} on ${DAYS[slot.dayOfWeek - 1]} ${slot.startTime}–${slot.endTime} will be permanently removed.`
    })
    if (!okDelete) return
    await fetch(`/api/v1/timetable/${slot.id}`, { method: 'DELETE' })
    fetchSlots()
  }

  const doSwap = async (target: Slot) => {
    if (!swapSource) return
    await fetch('/api/v1/timetable/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotAId: swapSource.id, slotBId: target.id })
    })
    setSwapSource(null)
    fetchSlots()
  }

  const onSlotTap = (slot: Slot) => {
    if (swapSource) {
      if (slot.id === swapSource.id) return setSwapSource(null)
      doSwap(slot)
      return
    }
    setSheet(slot)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#1565D8]" /> Timetable
          </h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
            The recurring weekly class plan. Tap a period to edit, swap or cancel it.
          </p>
        </div>

        {/* Controls: view toggle + target picker + week nav */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {isAdmin && (
            <div className="flex rounded-xl border border-slate-200 overflow-hidden w-full sm:w-auto">
              {(['class', 'teacher'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSwapSource(null) }}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold transition-colors ${
                    view === v ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {v === 'class' ? 'By class' : 'By teacher'}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {view === 'class' ? (
              /* Joined class · section control — one bordered pill, two segments */
              <div className="inline-flex items-stretch h-10 rounded-xl border border-slate-200 bg-white divide-x divide-slate-200">
                <div className="flex items-center gap-1.5 pl-3 shrink-0 min-w-[130px]">
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                  <AppSelect
                    value={gradeLabel}
                    onChange={(e) => {
                      setGradeLabel(e.target.value)
                      const secs = options.find((o) => o.name === e.target.value)?.sections ?? []
                      setSection(secs[0] ?? '')
                    }}
                    className="h-10 border-0 bg-transparent pr-2 text-sm font-semibold text-slate-800 min-w-[110px]"
                  >
                    {options.length === 0 && <option value="">No classes yet</option>}
                    {options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
                  </AppSelect>
                </div>
                <div className="flex items-center gap-1.5 pl-3 shrink-0 min-w-[140px]">
                  <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                  <AppSelect
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="h-10 border-0 bg-transparent pr-2 text-sm font-medium text-slate-600 min-w-[120px]"
                  >
                    <option value="">All sections</option>
                    {sectionsForClass.map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </AppSelect>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="inline-flex items-center h-10 rounded-xl border border-slate-200 bg-white pl-3">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <AppSelect
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="h-10 border-0 bg-transparent pl-1.5 pr-2 text-sm font-semibold text-slate-800 min-w-[170px]"
                >
                  <option value="">Select a teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </AppSelect>
              </div>
            ) : (
              <span className="h-10 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 text-sm font-semibold text-[#1565D8]">
                <User className="w-4 h-4" /> My timetable
              </span>
            )}
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-slate-50" title="Previous week">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={() => setWeekStart(mondayOf(localISO(new Date())))}
              className="px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#1565D8] whitespace-nowrap"
              title="This week"
            >
              {weekLabel}
            </button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-slate-50" title="Next week">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Colour legend */}
      {timeRows.length > 0 && !swapSource && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-500">
          <LegendDot className="bg-emerald-400" label="Now" />
          <LegendDot className="bg-[#1565D8]" label="Next" />
          <LegendDot className="bg-indigo-300" label="Upcoming" />
          <LegendDot className="bg-slate-300" label="Over" />
          <LegendDot className="bg-red-300" label="Cancelled" />
        </div>
      )}

      {/* Swap-mode banner */}
      {swapSource && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Swapping <b>{swapSource.subject}</b> — tap another period to swap with it.
          </p>
          <button onClick={() => setSwapSource(null)} className="text-sm font-semibold text-amber-700 hover:text-amber-900">
            Cancel
          </button>
        </div>
      )}

      {options.length === 0 && view === 'class' ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Set up your classes first</p>
          <p className="text-sm text-slate-400 mt-1">
            Add classes and sections in Settings → Classes &amp; Sections, then build the timetable here.
          </p>
        </div>
      ) : slotsLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : timeRows.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No periods yet</p>
          <p className="text-sm text-slate-400 mt-1">
            {view === 'class'
              ? (canAddHere ? 'Tap a day header below to add the first period.' : 'No periods scheduled for this class.')
              : 'This teacher has no periods scheduled.'}
          </p>
          {view === 'class' && canAddHere && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {DAYS.map((day, idx) => (
                <button key={day} onClick={() => openCreate(idx + 1)}
                  className="px-3 h-9 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:border-[#1565D8] hover:text-[#1565D8]">
                  + {DAYS_SHORT[idx]}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Time × day matrix — the classic weekly grid. Scrolls horizontally on
           narrow screens so the week structure is preserved on mobile. */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day header row */}
              <div className="grid border-b border-slate-100 bg-slate-50/60"
                style={{ gridTemplateColumns: `72px repeat(7, minmax(96px, 1fr))` }}>
                <div className="px-2 py-2.5" />
                {DAYS.map((day, idx) => {
                  const dateISO = slotDate(weekStart, idx + 1)
                  const isToday = dateISO === localISO(new Date())
                  return (
                    <div key={day} className={`px-2 py-2 text-center border-l border-slate-100 ${isToday ? 'bg-blue-50/60' : ''}`}>
                      <div className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-[#1565D8]' : 'text-slate-500'}`}>
                        {DAYS_SHORT[idx]}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(`${dateISO}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time rows */}
              {timeRows.map((tr) => (
                <div key={`${tr.startTime}-${tr.endTime}`} className="grid border-b border-slate-100 last:border-0"
                  style={{ gridTemplateColumns: `72px repeat(7, minmax(96px, 1fr))` }}>
                  <div className="px-2 py-2 flex flex-col justify-center bg-slate-50/40">
                    <span className="text-[11px] font-bold text-slate-600 leading-tight">{tr.startTime}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{tr.endTime}</span>
                  </div>
                  {DAYS.map((day, idx) => {
                    const dow = idx + 1
                    const cellSlots = cellMap.get(`${dow}|${tr.startTime}-${tr.endTime}`) ?? []
                    return (
                      <div key={day} className="border-l border-slate-100 p-1 min-h-[52px] space-y-1">
                        {cellSlots.map((slot) => (
                          <MatrixCell
                            key={slot.id}
                            slot={slot}
                            view={view}
                            swapping={swapSource?.id === slot.id}
                            status={periodStatus(slot, weekStart, now)}
                            isNext={slot.id === nextSlotId}
                            onTap={() => onSlotTap(slot)}
                          />
                        ))}
                        {cellSlots.length === 0 && canAddHere && !swapSource && (
                          <button
                            onClick={() => openCreate(dow, tr.startTime, tr.endTime)}
                            className="w-full h-full min-h-[44px] rounded-lg text-slate-200 hover:text-[#1565D8] hover:bg-blue-50/40 flex items-center justify-center transition"
                            title="Add period"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          {view === 'class' && canAddHere && (
            <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/40">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Add period:</span>
                {DAYS.map((day, idx) => (
                  <button key={day} onClick={() => openCreate(idx + 1)}
                    className="px-2.5 h-7 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-[#1565D8] hover:text-[#1565D8]">
                    + {DAYS_SHORT[idx]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Period action sheet */}
      {sheet && (
        <SlotSheet
          slot={sheet}
          view={view}
          weekStart={weekStart}
          isAdmin={isAdmin}
          onClose={() => setSheet(null)}
          onEdit={() => openEdit(sheet)}
          onSwap={() => { setSwapSource(sheet); setSheet(null) }}
          onCancel={(scope, restore) => cancelPeriod(sheet, scope, restore)}
          onDelete={() => remove(sheet)}
        />
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit period' : `Add period — ${gradeLabel}${!form.wholeClass && section ? ` · Section ${section}` : ''}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Day</label>
                <AppSelect value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">
                  {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </AppSelect>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Start time</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">End time</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subject</label>
                <input
                  list="timetable-subject-options"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Mathematics"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
                <datalist id="timetable-subject-options">
                  {subjectOptions.map((s) => <option key={s} value={s} />)}
                </datalist>
                {subjectOptions.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tip: add subjects in Settings → Subjects to get a dropdown here.
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Teacher (optional)</label>
                <AppSelect value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">
                  <option value="">—</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </AppSelect>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Room (optional)</label>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room 12" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              </div>
              {view === 'class' && section && (
                <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.wholeClass} onChange={(e) => setForm({ ...form, wholeClass: e.target.checked })} className="rounded border-slate-300" />
                  Applies to all sections of {gradeLabel}
                </label>
              )}
            </div>
            {formError && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{formError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-sm font-semibold">Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-[#1565D8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add period'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact period block. Colour tells time-of-week status at a glance:
//   past = grey · current = green (ring) · next = blue · upcoming = indigo ·
//   cancelled = red/amber (struck) · being-swapped = amber ring.
const STATUS_CLASS: Record<PeriodStatus | 'next', { card: string; title: string; sub: string }> = {
  past: { card: 'border-slate-200 bg-slate-100/70', title: 'text-slate-400', sub: 'text-slate-300' },
  current: { card: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200', title: 'text-emerald-900', sub: 'text-emerald-700' },
  next: { card: 'border-[#1565D8]/40 bg-blue-50 hover:bg-blue-100/70', title: 'text-[#1565D8]', sub: 'text-blue-500' },
  upcoming: { card: 'border-indigo-100 bg-indigo-50/60 hover:bg-indigo-50', title: 'text-slate-800', sub: 'text-slate-500' }
}

function MatrixCell({
  slot, view, swapping, status, isNext, onTap
}: {
  slot: Slot
  view: 'class' | 'teacher'
  swapping: boolean
  status: PeriodStatus
  isNext: boolean
  onTap: () => void
}) {
  const recurringCancelled = !!slot.cancelledAt
  const dateCancelled = !!slot.dateCancelled
  const off = recurringCancelled || dateCancelled
  const secondary = view === 'teacher'
    ? `${slot.gradeLabel}${slot.sectionKey !== 'ALL' ? ` · ${slot.sectionKey}` : ''}`
    : slot.teacher?.name ?? null

  const key = isNext && status === 'upcoming' ? 'next' : status
  const s = STATUS_CLASS[key]

  const card = swapping
    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
    : recurringCancelled
      ? 'border-red-100 bg-red-50/50'
      : dateCancelled
        ? 'border-amber-100 bg-amber-50/50'
        : s.card

  return (
    <button
      type="button"
      onClick={onTap}
      title={swapping ? 'Selected to swap' : 'Tap to edit, swap or cancel'}
      className={`relative w-full h-full text-left rounded-lg px-2 py-1.5 border transition ${card}`}
    >
      {status === 'current' && !off && (
        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      )}
      <p className={`text-xs font-bold leading-tight truncate ${off ? 'line-through text-slate-400' : s.title}`}>
        {slot.subject}
      </p>
      {secondary && (
        <p className={`text-[10px] leading-tight truncate mt-0.5 ${off ? 'text-slate-300' : s.sub}`}>
          {secondary}
        </p>
      )}
      {slot.room && !off && (
        <p className={`text-[10px] leading-tight truncate flex items-center gap-0.5 ${s.sub}`}>
          <MapPin className="w-2.5 h-2.5" />{slot.room}
        </p>
      )}
      {recurringCancelled && <span className="text-[9px] font-black uppercase tracking-wide text-red-500">Cancelled</span>}
      {!recurringCancelled && dateCancelled && <span className="text-[9px] font-black uppercase tracking-wide text-amber-600">Off this week</span>}
      {key === 'current' && !off && <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600">Now</span>}
      {key === 'next' && <span className="text-[8px] font-black uppercase tracking-wider text-[#1565D8]">Next</span>}
    </button>
  )
}

function SlotSheet({
  slot, view, weekStart, isAdmin, onClose, onEdit, onSwap, onCancel, onDelete
}: {
  slot: Slot
  view: 'class' | 'teacher'
  weekStart: string
  isAdmin: boolean
  onClose: () => void
  onEdit: () => void
  onSwap: () => void
  onCancel: (scope: 'recurring' | 'date', restore: boolean) => void
  onDelete: () => void
}) {
  const dateISO = slotDate(weekStart, slot.dayOfWeek)
  const dateLabel = new Date(`${dateISO}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  const recurringCancelled = !!slot.cancelledAt
  const dateCancelled = !!slot.dateCancelled

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">{slot.subject}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {slot.gradeLabel}{slot.sectionKey !== 'ALL' ? ` · Section ${slot.sectionKey}` : ' · Whole class'} · {slot.startTime}–{slot.endTime}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{dateLabel}{slot.teacher ? ` · ${slot.teacher.name}` : ''}{slot.room ? ` · ${slot.room}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        {(recurringCancelled || dateCancelled) && (
          <div className="mx-5 mt-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            {recurringCancelled ? 'This period is cancelled (recurring).' : 'This period is cancelled for this week only.'}
            {(slot.cancelReason || slot.dateCancelled?.reason) && <> Reason: {slot.cancelReason || slot.dateCancelled?.reason}</>}
          </div>
        )}

        {slot.canManage ? (
          <div className="p-4 grid grid-cols-1 gap-2">
            <SheetBtn icon={<Pencil className="w-4 h-4" />} label="Edit period" onClick={onEdit} />
            <SheetBtn icon={<ArrowLeftRight className="w-4 h-4" />} label="Swap with another period" onClick={onSwap} />
            {dateCancelled
              ? <SheetBtn icon={<RotateCcw className="w-4 h-4" />} label="Restore this week" onClick={() => onCancel('date', true)} />
              : <SheetBtn icon={<Ban className="w-4 h-4" />} label={`Cancel just this week (${dateLabel.split(',')[0]})`} onClick={() => onCancel('date', false)} />}
            {recurringCancelled
              ? <SheetBtn icon={<RotateCcw className="w-4 h-4" />} label="Restore recurring period" onClick={() => onCancel('recurring', true)} />
              : <SheetBtn icon={<Ban className="w-4 h-4" />} label="Cancel recurring period" danger onClick={() => onCancel('recurring', false)} />}
            {isAdmin && <SheetBtn icon={<Trash2 className="w-4 h-4" />} label="Delete permanently" danger onClick={onDelete} />}
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-500">You can only manage your own periods.</div>
        )}
      </div>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${className}`} />
      {label}
    </span>
  )
}

function SheetBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 h-11 rounded-xl border text-sm font-semibold transition ${
        danger
          ? 'border-red-100 text-red-600 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}{label}
    </button>
  )
}
