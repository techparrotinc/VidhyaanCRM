'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CalendarDays, MapPin, Video, Users, Pencil,
  Trash2, Search, Check, X, Megaphone, Ban, Info
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EVENT_TYPE_LABELS, EventType } from '@/constants/events'
import AnnounceModal from '@/components/events/AnnounceModal'
import { useConfirm } from '@/components/ui/confirm-dialog'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600'
}

const RSVP_BADGE: Record<string, string> = {
  GOING: 'bg-blue-50 text-blue-700',
  MAYBE: 'bg-amber-50 text-amber-700',
  NOT_GOING: 'bg-slate-100 text-slate-500',
  ATTENDED: 'bg-green-50 text-green-700'
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  })

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'attendees'>('overview')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadResults, setLeadResults] = useState<any[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const searchParams = useSearchParams()
  // ?announce=1 = arrived from Save & Publish — open the announce step directly
  const [showAnnounce, setShowAnnounce] = useState(searchParams?.get('announce') === '1')
  const confirmDialog = useConfirm()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/events/${id}`)
      const json = await res.json()
      if (json.success) setEvent(json.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const transition = async (action: 'publish' | 'cancel') => {
    const okToProceed = await confirmDialog(
      action === 'publish'
        ? {
            title: 'Publish this event?',
            message: 'Once published it cannot be edited — only cancelled. You can announce it to parents right after.',
            confirmLabel: 'Publish',
            variant: 'primary'
          }
        : {
            title: 'Cancel this event?',
            message: 'This cannot be undone. The attendee list is kept for records.',
            confirmLabel: 'Cancel Event',
            variant: 'danger'
          }
    )
    if (!okToProceed) return
    setBusy(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/v1/events/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.error || `Failed to ${action}`)
      }
      await load()
      if (action === 'publish') setShowAnnounce(true)
    } catch (e: any) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteDraft = async () => {
    const okToDelete = await confirmDialog({
      title: 'Delete this event?',
      message: 'The event will be removed from all views. Published events cannot be deleted — cancel them instead.',
      confirmLabel: 'Delete Event',
      variant: 'danger'
    })
    if (!okToDelete) return
    const res = await fetch(`/api/v1/events/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/event-management')
  }

  const searchLeads = async (term: string) => {
    setLeadSearch(term)
    if (term.trim().length < 2) return setLeadResults([])
    try {
      const res = await fetch(`/api/v1/leads?search=${encodeURIComponent(term)}&limit=8`)
      const json = await res.json()
      setLeadResults(json.data ?? [])
    } catch {
      setLeadResults([])
    }
  }

  const addLeadRsvp = async (leadId: string) => {
    setActionError(null)
    const res = await fetch(`/api/v1/events/${id}/rsvps`, {
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
    await fetch(`/api/v1/events/${id}/rsvps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpId, status })
    })
    load()
  }

  const removeRsvp = async (rsvpId: string) => {
    await fetch(`/api/v1/events/${id}/rsvps?rsvpId=${rsvpId}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        <p className="text-sm text-slate-400">Event not found.</p>
        <Link href="/event-management" className="text-sm font-semibold text-[#1565D8] hover:underline">← Back to events</Link>
      </div>
    )
  }

  const counts = event.rsvpCounts ?? { going: 0, maybe: 0, notGoing: 0, attended: 0 }
  const filled = counts.going + counts.attended
  const capacityPct = event.capacity ? Math.min(100, Math.round((filled / event.capacity) * 100)) : null
  const isDraft = event.status === 'DRAFT'
  const isPublished = event.status === 'PUBLISHED'

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Breadcrumb + hero */}
      <div>
        <Link href="/event-management"
          className="text-sm font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 mb-3">
          <ChevronLeft size={15} /> Events
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[event.status]}`}>
                  {event.status === 'DRAFT' ? 'Draft' : event.status === 'PUBLISHED' ? 'Published' : 'Cancelled'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#1565D8] bg-blue-50 px-2.5 py-1 rounded-full">
                  {EVENT_TYPE_LABELS[event.type as EventType] ?? event.type}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-slate-400" />
                  {fmtDateTime(event.startsAt)}{event.endsAt ? ` – ${fmtDateTime(event.endsAt)}` : ''}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-slate-400" /> {event.location}
                  </span>
                )}
                {event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#1565D8] font-semibold">
                    <Video size={15} /> Join link
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isDraft && (
                <>
                  <Link href={`/event-management/${id}/edit`}
                    className="border border-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
                    <Pencil size={14} /> Edit
                  </Link>
                  <button onClick={deleteDraft}
                    className="border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 text-sm font-semibold px-3 py-2 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => transition('publish')} disabled={busy}
                    className="bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                    <Megaphone size={14} /> Publish
                  </button>
                </>
              )}
              {isPublished && (
                <>
                  <button onClick={() => setShowAnnounce(true)} disabled={busy}
                    className="bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                    <Megaphone size={14} /> Announce
                  </button>
                  <button onClick={() => transition('cancel')} disabled={busy}
                    className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                    <Ban size={14} /> Cancel Event
                  </button>
                </>
              )}
              {event.status === 'CANCELLED' && (
                <button onClick={deleteDraft}
                  className="border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>

          {isPublished && (
            <div className="mt-4 flex items-center gap-2 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-700">
              <Info size={15} className="shrink-0" />
              This event is published and cannot be edited. If it is no longer happening, cancel it.
            </div>
          )}
          {event.status === 'CANCELLED' && (
            <div className="mt-4 flex items-center gap-2 bg-red-50/60 border border-red-100 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600">
              <Ban size={15} className="shrink-0" />
              This event was cancelled. The attendee list is kept for records.
            </div>
          )}
          {actionError && (
            <p className="mt-3 text-sm font-medium text-red-600">{actionError}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex border-b border-slate-100">
          {(['overview', 'attendees'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-[#1565D8] text-[#1565D8]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t === 'overview' ? 'Overview' : `Attendees (${event.rsvps?.length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' ? (
            <div className="space-y-6">
              {event.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.imageUrl} alt="Event cover" className="w-full max-h-64 object-cover rounded-xl border border-slate-100" />
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Going', counts.going, 'text-blue-700'],
                  ['Maybe', counts.maybe, 'text-amber-700'],
                  ['Declined', counts.notGoing, 'text-slate-500'],
                  ['Attended', counts.attended, 'text-green-700']
                ].map(([label, value, color]) => (
                  <div key={label as string} className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {event.capacity && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                    <span>Capacity</span>
                    <span>{filled} / {event.capacity}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${capacityPct! >= 100 ? 'bg-red-500' : 'bg-[#1565D8]'}`}
                      style={{ width: `${capacityPct}%` }} />
                  </div>
                </div>
              )}

              {event.description ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Description</p>
                  <p className="text-sm font-normal leading-relaxed text-slate-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No description.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isDraft ? (
                <div className="text-center py-10">
                  <Megaphone className="w-8 h-8 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
                  <h3 className="text-sm font-bold text-slate-700">Publish to invite attendees</h3>
                  <p className="text-sm text-slate-400 mt-1">Draft events are not announced — publish the event first.</p>
                </div>
              ) : (
                <>
                  {isPublished && (
                    <div className="relative max-w-md">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={leadSearch} onChange={(e) => searchLeads(e.target.value)}
                        placeholder="Search leads to invite (name / phone)…"
                        className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#1565D8]" />
                      {leadResults.length > 0 && (
                        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {leadResults.map((lead) => (
                            <button key={lead.id} onClick={() => addLeadRsvp(lead.id)}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-2">
                              <span className="text-sm text-slate-700 truncate">
                                {lead.parentName}
                                <span className="text-slate-400 ml-2 text-xs">{lead.phone}</span>
                              </span>
                              <span className="text-[10px] font-semibold text-[#1565D8]">Add</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(event.rsvps ?? []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No attendees yet{isPublished ? ' — search a lead above to invite.' : '.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {event.rsvps.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-3 py-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                            {(r.attendee?.name ?? 'G').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{r.attendee?.name ?? 'Guest'}</p>
                            <p className="text-xs text-slate-400">
                              {r.attendeeType.toLowerCase()}{r.attendee?.phone ? ` · ${r.attendee.phone}` : ''}
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${RSVP_BADGE[r.status] ?? ''}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                          {isPublished && r.status !== 'ATTENDED' && (
                            <button onClick={() => updateRsvp(r.id, 'ATTENDED')}
                              className="p-1.5 text-slate-300 hover:text-green-600 rounded" title="Mark attended">
                              <Check size={15} />
                            </button>
                          )}
                          {isPublished && (
                            <button onClick={() => removeRsvp(r.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 rounded" title="Remove">
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnnounceModal
        eventId={id}
        eventTitle={event.title}
        capacity={event.capacity}
        open={showAnnounce}
        onClose={() => setShowAnnounce(false)}
      />
    </div>
  )
}
