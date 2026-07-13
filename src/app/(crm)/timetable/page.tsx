'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Clock, MapPin, Pencil, Plus, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

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
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

export default function TimetablePage() {
  const confirm = useConfirm()
  const [options, setOptions] = useState<ClassOption[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [gradeLabel, setGradeLabel] = useState('')
  const [section, setSection] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [optRes, usersRes] = await Promise.all([
          fetch('/api/v1/options/classes'),
          fetch('/api/v1/users')
        ])
        const optJson = await optRes.json()
        const list: ClassOption[] = optJson?.data?.options ?? optJson?.options ?? []
        setOptions(list)
        if (list.length > 0) {
          setGradeLabel(list[0].name)
          setSection(list[0].sections[0] ?? '')
        }
        if (usersRes.ok) {
          const usersJson = await usersRes.json()
          const users: Teacher[] = usersJson?.data ?? []
          setTeachers(users.filter((u) => u.role === 'TEACHER'))
        } else {
          // Teachers list is admin-only; a TEACHER role still gets read access.
          setIsAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fetchSlots = useCallback(async () => {
    if (!gradeLabel) return
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({ gradeLabel })
      if (section) params.set('section', section)
      const res = await fetch(`/api/v1/timetable?${params}`)
      const json = await res.json()
      setSlots(json?.data?.slots ?? [])
    } finally {
      setSlotsLoading(false)
    }
  }, [gradeLabel, section])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const sectionsForClass = useMemo(
    () => options.find((o) => o.name === gradeLabel)?.sections ?? [],
    [options, gradeLabel]
  )

  const slotsByDay = useMemo(() => {
    const map = new Map<number, Slot[]>()
    for (const s of slots) {
      const list = map.get(s.dayOfWeek) ?? []
      list.push(s)
      map.set(s.dayOfWeek, list)
    }
    return map
  }, [slots])

  const openCreate = (dayOfWeek: number) => {
    setForm({ ...emptyForm, dayOfWeek, wholeClass: !section })
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (slot: Slot) => {
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
    if (!form.subject.trim()) {
      setFormError('Subject is required')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        gradeLabel,
        section: form.wholeClass ? null : section || null,
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
        setFormError((first as string) || json?.error?.message || 'Failed to save slot')
        return
      }
      setDialogOpen(false)
      fetchSlots()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (slot: Slot) => {
    const okDelete = await confirm({
      title: 'Delete this period?',
      message: `${slot.subject} on ${DAYS[slot.dayOfWeek - 1]} ${slot.startTime}–${slot.endTime} will be removed from the timetable.`
    })
    if (!okDelete) return
    await fetch(`/api/v1/timetable/${slot.id}`, { method: 'DELETE' })
    fetchSlots()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#1565D8]" /> Timetable
          </h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
            Weekly class schedule — visible to teachers and parents.
          </p>
        </div>

        {/* Class / section picker */}
        <div className="flex items-center gap-2">
          <select
            value={gradeLabel}
            onChange={(e) => {
              setGradeLabel(e.target.value)
              const secs = options.find((o) => o.name === e.target.value)?.sections ?? []
              setSection(secs[0] ?? '')
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
          >
            {options.length === 0 && <option value="">No classes yet</option>}
            {options.map((o) => (
              <option key={o.name} value={o.name}>{o.name}</option>
            ))}
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
          >
            <option value="">All sections</option>
            {sectionsForClass.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
      </div>

      {options.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Set up your classes first</p>
          <p className="text-sm text-slate-400 mt-1">
            Add classes and sections in Settings → Classes &amp; Sections, then build the timetable here.
          </p>
        </div>
      ) : (
        /* Week grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map((day, idx) => {
            const dayOfWeek = idx + 1
            const daySlots = slotsByDay.get(dayOfWeek) ?? []
            return (
              <div key={day} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{day}</h3>
                  {isAdmin && (
                    <button
                      onClick={() => openCreate(dayOfWeek)}
                      className="text-[#1565D8] hover:bg-blue-50 rounded-lg p-1 transition cursor-pointer"
                      title={`Add period on ${day}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-3 space-y-2 flex-1">
                  {slotsLoading ? (
                    <Skeleton className="h-14 w-full rounded-xl" />
                  ) : daySlots.length > 0 ? (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="group rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-[#1565D8]/30 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{slot.subject}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {slot.startTime}–{slot.endTime}
                              </span>
                              {slot.teacher && (
                                <span className="flex items-center gap-1 truncate">
                                  <User className="w-3 h-3" /> {slot.teacher.name}
                                </span>
                              )}
                              {slot.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {slot.room}
                                </span>
                              )}
                            </div>
                            {slot.sectionKey === 'ALL' && section && (
                              <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                                Whole class
                              </span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => openEdit(slot)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#1565D8] hover:bg-blue-50 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => remove(slot)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-300 font-semibold text-center py-6">No periods</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'Edit period' : 'Add period'} — {gradeLabel}
              {!form.wholeClass && section ? ` · Section ${section}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Day</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i + 1}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Start time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">End time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Mathematics"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Teacher (optional)</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  <option value="">—</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Room (optional)</label>
                <input
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="Room 12"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              {section && (
                <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wholeClass}
                    onChange={(e) => setForm({ ...form, wholeClass: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Applies to all sections of {gradeLabel}
                </label>
              )}
            </div>

            {formError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-sm font-semibold">
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="bg-[#1565D8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              >
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add period'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
