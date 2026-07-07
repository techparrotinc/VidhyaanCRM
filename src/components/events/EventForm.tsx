'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CalendarDays, MapPin, Users, Video, AlignLeft, Tag, ImagePlus, Loader2, X } from 'lucide-react'
import { EVENT_TYPE_LABELS, SCHOOL_EVENT_TYPES, CENTER_EVENT_TYPES, EventType } from '@/constants/events'
import { DateTimePicker } from '@/components/ui/datetime-picker'

export interface EventPayload {
  title: string
  description: string | null
  type: EventType
  capacity: number | null
  startsAt: string
  endsAt: string | null
  location: string | null
  meetingLink: string | null
  imageUrl: string | null
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
  imageUrl: string
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
  const [form, setForm] = useState<FormState>(() => {
    // New events default to today at the next full hour
    const defaultStart = new Date()
    defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0)
    return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    type: (initial?.type as EventType) ?? 'OTHER',
    capacity: initial?.capacity ? String(initial.capacity) : '',
    startsAt: initial?.startsAt ?? defaultStart.toISOString(),
    endsAt: initial?.endsAt ?? '',
    location: initial?.location ?? '',
    meetingLink: initial?.meetingLink ?? '',
    imageUrl: initial?.imageUrl ?? ''
    }
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'CENTER'>('SCHOOL')
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then((r) => r.json())
      .then((j) => {
        const t = j?.data?.institutionType ?? j?.institutionType
        if (t && t !== 'SCHOOL' && t !== 'JUNIOR_COLLEGE') setInstitutionType('CENTER')
      })
      .catch(() => {})
  }, [])

  const typeOptions = institutionType === 'SCHOOL' ? SCHOOL_EVENT_TYPES : CENTER_EVENT_TYPES

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Cover must be an image')
    if (file.size > 5 * 1024 * 1024) return setError('Image too large (max 5MB)')
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/files/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed')
      setForm(f => ({ ...f, imageUrl: json.url }))
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

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
        meetingLink: form.meetingLink || null,
        imageUrl: form.imageUrl || null
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
        {/* LEFT: what */}
        <div className="lg:col-span-3 p-6 space-y-5 lg:border-r border-slate-100">
          <Field label="Event Title" icon={Tag} required>
            <input value={form.title} onChange={set('title')} maxLength={200}
              className={inputCls} placeholder="e.g. Annual Open House 2026" autoFocus />
          </Field>

          <Field label="Event Type" icon={Tag}>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    form.type === t
                      ? 'bg-[#1565D8] border-[#1565D8] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-[#1565D8] hover:text-[#1565D8]'
                  }`}
                >
                  {EVENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Description" icon={AlignLeft}>
            <textarea value={form.description} onChange={set('description')} maxLength={5000} rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Agenda, who should attend, what to bring…" />
          </Field>

          <Field label="Cover Image" icon={ImagePlus}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadImage(f)
                e.target.value = ''
              }}
            />
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="Event cover" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-semibold cursor-pointer">
                    Replace
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="px-3 py-1.5 rounded-lg bg-white text-red-600 text-xs font-semibold cursor-pointer flex items-center gap-1">
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1565D8] hover:bg-blue-50/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#1565D8] cursor-pointer disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-xs font-semibold">{uploading ? 'Uploading…' : 'Add a cover image (used in announcements)'}</span>
              </button>
            )}
          </Field>
        </div>

        {/* RIGHT: when & logistics */}
        <div className="lg:col-span-2 p-6 space-y-5 bg-slate-50/50 rounded-r-xl">
          <Field label="Starts" icon={CalendarDays} required>
            <DateTimePicker
              value={form.startsAt}
              onChange={(iso) => setForm(f => ({ ...f, startsAt: iso }))}
              placeholder="Pick start date & time"
            />
          </Field>

          <Field label="Ends" icon={CalendarDays}>
            <DateTimePicker
              value={form.endsAt}
              onChange={(iso) => setForm(f => ({ ...f, endsAt: iso }))}
              placeholder="Optional end date & time"
            />
          </Field>

          <Field label="Location" icon={MapPin}>
            <input value={form.location} onChange={set('location')} maxLength={300}
              className={inputCls} placeholder="Main auditorium / Campus" />
          </Field>

          <Field label="Meeting Link" icon={Video}>
            <input value={form.meetingLink} onChange={set('meetingLink')} maxLength={1000}
              className={inputCls} placeholder="https://meet.google.com/… (online events)" />
          </Field>

          <Field label="Capacity" icon={Users}>
            <input type="number" min={1} value={form.capacity} onChange={set('capacity')}
              className={inputCls} placeholder="Leave empty for unlimited" />
          </Field>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400 hidden sm:block">
          Saved as draft — publish &amp; announce when ready.
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button onClick={onCancel}
            className="border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={submit} disabled={saving || uploading}
            className="bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-6 py-2.5 cursor-pointer">
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
