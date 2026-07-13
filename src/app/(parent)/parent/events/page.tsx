'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { CalendarDays, MapPin, Video, Check, X, Loader2, CalendarX, Clock } from 'lucide-react'
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

const TYPE_GRADIENT: Record<string, string> = {
  PTM: 'from-[#1565D8] to-indigo-600',
  ANNUAL_DAY: 'from-violet-500 to-fuchsia-600',
  EXHIBITION: 'from-teal-500 to-emerald-600',
  OPEN_HOUSE: 'from-orange-500 to-rose-500',
  WORKSHOP: 'from-amber-500 to-orange-600'
}

const TYPE_LABEL: Record<string, string> = {
  PTM: 'Parent–Teacher Meeting',
  ANNUAL_DAY: 'Annual Day',
  EXHIBITION: 'Exhibition',
  OPEN_HOUSE: 'Open House',
  WORKSHOP: 'Workshop'
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

function daysUntil(iso: string): string | null {
  const now = new Date()
  const d = new Date(iso)
  const diff = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7) return `In ${diff} days`
  return null
}

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
    <div className="space-y-7">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-slate-900">Events</h1>
        <p className="text-sm font-semibold text-slate-400 mt-0.5">
          Meetings, celebrations and workshops from your child&apos;s school
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm font-semibold text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center">
          <CalendarX className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-black text-slate-700">No upcoming events</h3>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Your school hasn&apos;t published any events yet — check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {events.map((ev) => {
            const going = ev.myRsvp?.status === 'GOING' || ev.myRsvp?.status === 'ATTENDED'
            const declined = ev.myRsvp?.status === 'NOT_GOING'
            const gradient = TYPE_GRADIENT[ev.type ?? ''] ?? 'from-slate-600 to-slate-800'
            const soon = daysUntil(ev.startsAt)
            const d = new Date(ev.startsAt)
            return (
              <div key={ev.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                {/* Banner */}
                {ev.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.imageUrl} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className={`relative h-28 bg-gradient-to-r ${gradient} px-5 flex items-end pb-3.5 overflow-hidden`}>
                    <div className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/10" />
                    <div className="absolute top-8 right-20 w-16 h-16 rounded-full bg-white/5" />
                    {soon && (
                      <span className="absolute top-3.5 right-4 bg-white/20 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1 border border-white/20">
                        {soon}
                      </span>
                    )}
                    <span className="text-white/90 text-[10px] font-black uppercase tracking-widest relative">
                      {TYPE_LABEL[ev.type ?? ''] ?? ev.type ?? 'Event'} · {ev.orgName}
                    </span>
                  </div>
                )}

                <div className="p-5 relative">
                  {/* Floating date chip */}
                  <div className="absolute -top-7 right-5 w-14 h-14 rounded-2xl bg-white shadow-lg border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800 leading-none">{d.getDate()}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#1565D8] mt-0.5">
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 pr-16">{ev.title}</h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[13px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-300" /> {fmtDay(ev.startsAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-300" />
                      {fmtTime(ev.startsAt)}{ev.endsAt ? ` – ${fmtTime(ev.endsAt)}` : ''}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-300" /> {ev.location}
                      </span>
                    )}
                    {ev.meetingLink && (
                      <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#1565D8] font-bold hover:underline">
                        <Video size={14} /> Join online
                      </a>
                    )}
                  </div>

                  {ev.description && (
                    <p className="mt-3 text-sm font-medium text-slate-400 leading-relaxed line-clamp-3">{ev.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-2.5">
                    <button
                      onClick={() => rsvp(ev.id, 'GOING')}
                      disabled={busyId === ev.id}
                      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-black transition cursor-pointer disabled:opacity-60 ${
                        going
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/60'
                          : 'bg-[#1565D8] text-white hover:bg-blue-700 shadow-md shadow-blue-200/60'
                      }`}
                    >
                      {busyId === ev.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                      {going ? "You're going" : "I'll attend"}
                    </button>
                    <button
                      onClick={() => rsvp(ev.id, 'NOT_GOING')}
                      disabled={busyId === ev.id}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer disabled:opacity-60 ${
                        declined
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
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
