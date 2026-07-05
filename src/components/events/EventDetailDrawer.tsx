'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { X, MapPin, Video, Users, CalendarDays, Pencil, Trash2, Search, Check } from 'lucide-react'
import { EVENT_TYPE_LABELS, EventType } from '@/constants/events'

const STATUS_STYLES: Record<string, string> = {
  GOING: 'bg-blue-50 text-blue-700',
  MAYBE: 'bg-amber-50 text-amber-700',
  NOT_GOING: 'bg-slate-100 text-slate-500',
  ATTENDED: 'bg-green-50 text-green-700'
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  })

export default function EventDetailDrawer({
  open,
  eventId,
  onClose,
  onEdit,
  onDeleted
}: {
  open: boolean
  eventId: string | null
  onClose: () => void
  onEdit: (event: any) => void
  onDeleted: () => void
}) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'details' | 'rsvps'>('details')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadResults, setLeadResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/events/${eventId}`)
      const json = await res.json()
      if (json.success) setEvent(json.data)
    } catch (e) {
      console.error('Failed to load event', e)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (open && eventId) {
      setTab('details')
      setLeadSearch('')
      setLeadResults([])
      setActionError(null)
      load()
    }
  }, [open, eventId, load])

  if (!open) return null

  const searchLeads = async (term: string) => {
    setLeadSearch(term)
    if (term.trim().length < 2) {
      setLeadResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/v1/leads?search=${encodeURIComponent(term)}&limit=8`)
      const json = await res.json()
      setLeadResults(json.data ?? [])
    } catch {
      setLeadResults([])
    } finally {
      setSearching(false)
    }
  }

  const addLeadRsvp = async (leadId: string) => {
    setActionError(null)
    const res = await fetch(`/api/v1/events/${eventId}/rsvps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendeeType: 'LEAD', attendeeId: leadId })
    })
    const json = await res.json()
    if (!res.ok || json.success === false) {
      setActionError(json.error?.message || json.error || 'Failed to add attendee')
      return
    }
    setLeadSearch('')
    setLeadResults([])
    load()
  }

  const updateRsvp = async (rsvpId: string, status: string) => {
    setActionError(null)
    const res = await fetch(`/api/v1/events/${eventId}/rsvps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpId, status })
    })
    if (res.ok) load()
  }

  const removeRsvp = async (rsvpId: string) => {
    setActionError(null)
    const res = await fetch(`/api/v1/events/${eventId}/rsvps?rsvpId=${rsvpId}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  const deleteEvent = async () => {
    if (!confirm('Delete this event? RSVPs will be kept but the event will no longer be visible.')) return
    const res = await fetch(`/api/v1/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) {
      onDeleted()
      onClose()
    }
  }

  const counts = event?.rsvpCounts ?? { going: 0, maybe: 0, notGoing: 0, attended: 0 }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-slate-200">
          <div className="min-w-0">
            {event?.type && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1565D8] bg-blue-50 px-2 py-0.5 rounded">
                {EVENT_TYPE_LABELS[event.type as EventType] ?? event.type}
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5 truncate">
              {event?.title ?? 'Event'}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => event && onEdit(event)}
              className="p-2 text-slate-400 hover:text-[#1565D8] rounded-lg hover:bg-blue-50"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={deleteEvent}
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          {(['details', 'rsvps'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                tab === t ? 'border-[#1565D8] text-[#1565D8]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t === 'details' ? 'Details' : `RSVPs (${event?.rsvps?.length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && <p className="text-sm text-slate-400">Loading…</p>}

          {!loading && event && tab === 'details' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CalendarDays size={15} className="text-slate-400 shrink-0" />
                  <span>
                    {fmtDateTime(event.startsAt)}
                    {event.endsAt ? ` – ${fmtDateTime(event.endsAt)}` : ''}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.meetingLink && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Video size={15} className="text-slate-400 shrink-0" />
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#1565D8] font-semibold truncate">
                      {event.meetingLink}
                    </a>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Users size={15} className="text-slate-400 shrink-0" />
                    <span>
                      {counts.going + counts.attended} / {event.capacity} spots filled
                    </span>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 grid grid-cols-4 gap-2">
                {[
                  ['Going', counts.going, 'text-blue-700'],
                  ['Maybe', counts.maybe, 'text-amber-700'],
                  ['Declined', counts.notGoing, 'text-slate-500'],
                  ['Attended', counts.attended, 'text-green-700']
                ].map(([label, value, color]) => (
                  <div key={label as string} className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && event && tab === 'rsvps' && (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={leadSearch}
                  onChange={(e) => searchLeads(e.target.value)}
                  placeholder="Search leads to invite (name / phone)…"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
                />
                {leadResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {leadResults.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => addLeadRsvp(lead.id)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-slate-700 truncate">
                          {lead.parentName}
                          <span className="text-slate-400 ml-2 text-xs">{lead.phone}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[#1565D8]">Add</span>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <p className="text-xs text-slate-400 mt-1">Searching…</p>}
              </div>

              {actionError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</p>
              )}

              {(event.rsvps ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No attendees yet. Search a lead above to invite.</p>
              ) : (
                <div className="space-y-2">
                  {event.rsvps.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 border border-slate-100 rounded-lg px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.attendee?.name ?? 'Guest'}</p>
                        <p className="text-xs text-slate-400">
                          {r.attendeeType.toLowerCase()}
                          {r.attendee?.phone ? ` · ${r.attendee.phone}` : ''}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? ''}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      {r.status !== 'ATTENDED' && (
                        <button
                          onClick={() => updateRsvp(r.id, 'ATTENDED')}
                          className="p-1.5 text-slate-300 hover:text-green-600 rounded"
                          title="Mark attended"
                        >
                          <Check size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => removeRsvp(r.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded"
                        title="Remove"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
