'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { EVENT_TYPE_LABELS, SCHOOL_EVENT_TYPES, CENTER_EVENT_TYPES, EventType } from '@/constants/events'

export interface EventFormData {
  id?: string
  title: string
  description: string
  type: EventType
  capacity: string
  startsAt: string
  endsAt: string
  location: string
  meetingLink: string
}

const EMPTY_FORM: EventFormData = {
  title: '',
  description: '',
  type: 'OTHER',
  capacity: '',
  startsAt: '',
  endsAt: '',
  location: '',
  meetingLink: ''
}

// datetime-local input value from an ISO string
function toLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventDrawer({
  open,
  event,
  onClose,
  onSaved
}: {
  open: boolean
  event: any | null // null = create
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (event) {
      setForm({
        id: event.id,
        title: event.title ?? '',
        description: event.description ?? '',
        type: (event.type as EventType) ?? 'OTHER',
        capacity: event.capacity ? String(event.capacity) : '',
        startsAt: toLocalInput(event.startsAt),
        endsAt: toLocalInput(event.endsAt),
        location: event.location ?? '',
        meetingLink: event.meetingLink ?? ''
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [open, event])

  if (!open) return null

  const set = (k: keyof EventFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.title.trim() || !form.startsAt) {
      setError('Title and start date are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        type: form.type,
        capacity: form.capacity ? Number(form.capacity) : null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location || null,
        meetingLink: form.meetingLink || null
      }
      const res = await fetch(form.id ? `/api/v1/events/${form.id}` : '/api/v1/events', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.error || 'Failed to save event')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            {form.id ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Title *</label>
            <input
              value={form.title}
              onChange={set('title')}
              maxLength={200}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
              placeholder="e.g. Annual Open House"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Type</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1565D8]"
            >
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Starts *</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={set('startsAt')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Ends</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={set('endsAt')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Location</label>
              <input
                value={form.location}
                onChange={set('location')}
                maxLength={300}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
                placeholder="Main auditorium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={set('capacity')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Meeting Link</label>
            <input
              value={form.meetingLink}
              onChange={set('meetingLink')}
              maxLength={1000}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
              placeholder="https://meet.google.com/…"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              maxLength={5000}
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1565D8] resize-none"
              placeholder="Agenda, audience, notes…"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg py-2.5 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5"
          >
            {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
