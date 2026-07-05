'use client'

import React, { useState } from 'react'
import { CalendarDays, MapPin, Users, Video, AlignLeft, Tag } from 'lucide-react'
import { EVENT_TYPE_LABELS, SCHOOL_EVENT_TYPES, CENTER_EVENT_TYPES, EventType } from '@/constants/events'

export interface EventPayload {
  title: string
  description: string | null
  type: EventType
  capacity: number | null
  startsAt: string
  endsAt: string | null
  location: string | null
  meetingLink: string | null
}

interface FormState {
  title: string
  description: string
  type: EventType
  capacity: string
  startsAt: string
  endsAt: string
  location: string
  meetingLink: string
}

// datetime-local input value from an ISO string
export function toLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-blue-50'

function Field({
  label, icon: Icon, required, children
}: { label: string; icon?: any; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function EventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel
}: {
  initial?: any
  submitLabel: string
  onSubmit: (payload: EventPayload) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    type: (initial?.type as EventType) ?? 'OTHER',
    capacity: initial?.capacity ? String(initial.capacity) : '',
    startsAt: toLocalInput(initial?.startsAt),
    endsAt: toLocalInput(initial?.endsAt),
    location: initial?.location ?? '',
    meetingLink: initial?.meetingLink ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.title.trim()) return setError('Title is required')
    if (!form.startsAt) return setError('Start date & time is required')
    if (form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      return setError('End time must be after start time')
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description || null,
        type: form.type,
        capacity: form.capacity ? Number(form.capacity) : null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location || null,
        meetingLink: form.meetingLink || null
      })
    } catch (e: any) {
      setError(e.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* LEFT: what & where */}
        <div className="lg:col-span-3 p-6 space-y-5 lg:border-r border-slate-100">
          <Field label="Event Title" icon={Tag} required>
            <input value={form.title} onChange={set('title')} maxLength={200}
              className={inputCls} placeholder="e.g. Annual Open House 2026" autoFocus />
          </Field>

          <Field label="Event Type" icon={Tag}>
            <select value={form.type} onChange={set('type')} className={`${inputCls} bg-white`}>
              <optgroup label="School">
                {SCHOOL_EVENT_TYPES.filter(t => t !== 'OTHER').map(t => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </optgroup>
              <optgroup label="Learning / Coaching Center">
                {CENTER_EVENT_TYPES.filter(t => t !== 'OTHER' && t !== 'HOLIDAY').map(t => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </optgroup>
              <option value="OTHER">Other</option>
            </select>
          </Field>

          <Field label="Description" icon={AlignLeft}>
            <textarea value={form.description} onChange={set('description')} maxLength={5000} rows={6}
              className={`${inputCls} resize-none`}
              placeholder="Agenda, who should attend, what to bring…" />
          </Field>
        </div>

        {/* RIGHT: when & logistics */}
        <div className="lg:col-span-2 p-6 space-y-5 bg-slate-50/50 rounded-r-xl">
          <Field label="Starts" icon={CalendarDays} required>
            <input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className={inputCls} />
          </Field>

          <Field label="Ends" icon={CalendarDays}>
            <input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className={inputCls} />
          </Field>

          <Field label="Location" icon={MapPin}>
            <input value={form.location} onChange={set('location')} maxLength={300}
              className={inputCls} placeholder="Main auditorium / Campus" />
          </Field>

          <Field label="Capacity" icon={Users}>
            <input type="number" min={1} value={form.capacity} onChange={set('capacity')}
              className={inputCls} placeholder="Leave empty for unlimited" />
          </Field>

          <Field label="Meeting Link" icon={Video}>
            <input value={form.meetingLink} onChange={set('meetingLink')} maxLength={1000}
              className={inputCls} placeholder="https://meet.google.com/…" />
          </Field>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400 hidden sm:block">
          Saved as draft — you can edit until you publish.
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button onClick={onCancel}
            className="border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-6 py-2.5">
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
