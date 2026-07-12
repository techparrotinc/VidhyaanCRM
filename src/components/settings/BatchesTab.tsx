'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'

// Batch management for LC/coaching orgs — rendered as a tab on
// /settings/courses. Batches feed lead forms, student assignment and
// attendance sessions.

type Batch = {
  id: string
  name: string
  courseId: string | null
  course: { id: string; name: string } | null
  daysOfWeek: string[]
  startTime: string | null
  endTime: string | null
  capacity: number | null
  isActive: boolean
  _count: { students: number }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const emptyForm = {
  name: '',
  courseId: '',
  daysOfWeek: [] as string[],
  startTime: '',
  endTime: '',
  capacity: '',
  isActive: true
}

export function BatchesTab() {
  const confirm = useConfirm()
  const [batches, setBatches] = useState<Batch[] | null>(null)
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/v1/settings/batches')
      .then(r => r.json())
      .then(json => setBatches(json?.data?.batches ?? []))
      .catch(() => setBatches([]))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    fetch('/api/v1/settings/courses')
      .then(r => r.json())
      .then(json => setCourses((json?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (b: Batch) => {
    setEditing(b)
    setForm({
      name: b.name,
      courseId: b.courseId ?? '',
      daysOfWeek: b.daysOfWeek,
      startTime: b.startTime ?? '',
      endTime: b.endTime ?? '',
      capacity: b.capacity ? String(b.capacity) : '',
      isActive: b.isActive
    })
    setError(null)
    setShowForm(true)
  }

  const toggleDay = (day: string) =>
    setForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }))

  const save = async () => {
    if (!form.name.trim()) {
      setError('Batch name is required')
      return
    }
    setSaving(true)
    setError(null)
    const body = {
      name: form.name.trim(),
      courseId: form.courseId || null,
      daysOfWeek: form.daysOfWeek,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      isActive: form.isActive
    }
    const res = await fetch(
      editing ? `/api/v1/settings/batches/${editing.id}` : '/api/v1/settings/batches',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    )
    const json = await res.json()
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(json?.error || 'Failed to save batch')
      return
    }
    setShowForm(false)
    load()
  }

  const remove = async (b: Batch) => {
    if (b._count.students > 0) {
      setError(`${b.name} has ${b._count.students} student(s) assigned. Reassign them first.`)
      return
    }
    const okToDelete = await confirm({
      title: `Delete ${b.name}?`,
      message: 'The batch will no longer appear in lead forms, student assignment or attendance.',
      confirmLabel: 'Delete'
    })
    if (!okToDelete) return
    setError(null)
    const res = await fetch(`/api/v1/settings/batches/${b.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) setError(json?.error || 'Failed to delete batch')
    load()
  }

  const schedule = (b: Batch) => {
    const days = b.daysOfWeek.length > 0 ? b.daysOfWeek.join(', ') : null
    const time = b.startTime ? `${b.startTime}${b.endTime ? `–${b.endTime}` : ''}` : null
    return [days, time].filter(Boolean).join(' · ')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Batches group students into recurring cohorts — used in enquiry forms, student
          assignment and attendance sessions.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Batch
        </button>
      </div>

      {error && !showForm && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {editing ? 'Edit Batch' : 'Add New Batch'}
          </h2>
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Batch Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Morning Batch, Weekend Level 2"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Linked Course</label>
              <select
                value={form.courseId}
                onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">No specific course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Days</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      form.daysOfWeek.includes(day)
                        ? 'bg-[#1565D8] text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update Batch' : 'Save Batch'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {batches === null ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            Loading batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">No batches yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add batches like Morning, Evening or Weekend to organise students
            </p>
          </div>
        ) : (
          batches.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                  {b.course && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {b.course.name}
                    </span>
                  )}
                  {!b.isActive && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {schedule(b) && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule(b)}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {b._count.students} student{b._count.students === 1 ? '' : 's'}
                    {b.capacity ? ` / ${b.capacity}` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(b)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
