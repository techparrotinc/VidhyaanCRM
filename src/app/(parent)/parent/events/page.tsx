'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { CalendarDays, MapPin, Video, Check, X, Loader2, CalendarX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type PortalEvent = {
  id: string
  title: string
  description: string | null
  type: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  meetingLink: string | null
  imageUrl: string | null
  orgName: string
  myRsvp: { id: string; status: string } | null
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })

export default function ParentEventsPage() {
  const [events, setEvents] = useState<PortalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/parent/events')
      const json = await res.json()
      if (json.success) setEvents(json.data ?? [])
      else setError(json.error || 'Failed to load events')
    } catch {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rsvp = async (eventId: string, status: 'GOING' | 'NOT_GOING') => {
    setBusyId(eventId)
    setError(null)
    try {
      const res = await fetch(`/api/v1/parent/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save RSVP')
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, myRsvp: json.data } : e))
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Events</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
          Upcoming events, meetings and workshops from your child&apos;s school.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <CalendarX className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-slate-700">No upcoming events</h3>
          <p className="text-sm text-slate-400 mt-1">
            Your school hasn&apos;t published any events yet — check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const going = ev.myRsvp?.status === 'GOING' || ev.myRsvp?.status === 'ATTENDED'
            const declined = ev.myRsvp?.status === 'NOT_GOING'
            return (
              <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {ev.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.imageUrl} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{ev.orgName}</p>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{ev.title}</h3>
                    </div>
                    <div className="shrink-0 text-center bg-blue-50 rounded-xl px-3 py-2">
                      <div className="text-[10px] font-bold uppercase text-[#1565D8]">
                        {new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short' })}
                      </div>
                      <div className="text-xl font-bold text-slate-800 leading-none">{new Date(ev.startsAt).getDate()}</div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-400" /> {fmtWhen(ev.startsAt)}
                    </p>
                    {ev.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" /> {ev.location}
                      </p>
                    )}
                    {ev.meetingLink && (
                      <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#1565D8] font-semibold hover:underline">
                        <Video size={14} /> Join online
                      </a>
                    )}
                  </div>

                  {ev.description && (
                    <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">{ev.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => rsvp(ev.id, 'GOING')}
                      disabled={busyId === ev.id}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                        going
                          ? 'bg-green-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700'
                      }`}
                    >
                      {busyId === ev.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {going ? "You're going" : "I'll attend"}
                    </button>
                    <button
                      onClick={() => rsvp(ev.id, 'NOT_GOING')}
                      disabled={busyId === ev.id}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                        declined
                          ? 'bg-slate-200 text-slate-600'
                          : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <X size={14} /> {declined ? 'Not going' : "Can't make it"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
