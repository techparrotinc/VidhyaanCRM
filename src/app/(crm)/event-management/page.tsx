'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Calendar, CalendarDays, List, Plus, MapPin, Users,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import EventDrawer from '@/components/events/EventDrawer'
import EventDetailDrawer from '@/components/events/EventDetailDrawer'
import { EVENT_TYPE_LABELS, EventType } from '@/constants/events'

type Scope = 'upcoming' | 'past'
type View = 'list' | 'calendar'

const TYPE_COLORS: Record<string, string> = {
  OPEN_HOUSE: 'bg-blue-500', PTM: 'bg-violet-500', ANNUAL_DAY: 'bg-pink-500',
  SPORTS_DAY: 'bg-orange-500', HOLIDAY: 'bg-slate-400', ADMISSION_DRIVE: 'bg-green-500',
  DEMO_CLASS: 'bg-cyan-500', WORKSHOP: 'bg-indigo-500', COMPETITION: 'bg-amber-500',
  BATCH_EVENT: 'bg-teal-500', OTHER: 'bg-slate-500'
}

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function EventManagementPage() {
  const [view, setView] = useState<View>('list')
  const [scope, setScope] = useState<Scope>('upcoming')
  const [events, setEvents] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = view === 'calendar'
        ? `month=${monthKey(calMonth)}&limit=100`
        : `scope=${scope}&page=${page}&limit=25`
      const res = await fetch(`/api/v1/events?${params}`)
      const json = await res.json()
      if (json.success) {
        setEvents(json.data ?? [])
        setTotal(json.pagination?.total ?? (json.data?.length ?? 0))
        setTotalPages(json.pagination?.totalPages ?? 1)
      }
    } catch (e) {
      console.error('Failed to fetch events', e)
    } finally {
      setLoading(false)
    }
  }, [view, scope, page, calMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const openCreate = () => { setEditingEvent(null); setFormOpen(true) }
  const openEdit = (event: any) => { setDetailId(null); setEditingEvent(event); setFormOpen(true) }

  // calendar grid: leading blanks + days of month
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay()
  const eventsByDay = new Map<number, any[]>()
  for (const ev of events) {
    const d = new Date(ev.startsAt)
    if (d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear()) {
      const day = d.getDate()
      eventsByDay.set(day, [...(eventsByDay.get(day) ?? []), ev])
    }
  }
  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === calMonth.getMonth() &&
    today.getFullYear() === calMonth.getFullYear()

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Event Management</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
            Open days, PTMs, demo classes and RSVPs
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
          {(['list', 'calendar'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-1.5 ${
                view === v ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {v === 'list' ? <List size={14} /> : <CalendarDays size={14} />}
              {v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>

        {view === 'list' ? (
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            {(['upcoming', 'past'] as Scope[]).map(s => (
              <button
                key={s}
                onClick={() => { setScope(s); setPage(1) }}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md capitalize ${
                  scope === s ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-800 w-36 text-center">
              {calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : view === 'list' ? (
        events.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-slate-700">No {scope} events</h3>
            <p className="text-sm text-slate-400 mt-1">
              {scope === 'upcoming' ? 'Create your first event to start collecting RSVPs.' : 'Past events will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setDetailId(ev.id)}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 md:p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all text-left"
              >
                <div className="w-14 shrink-0 text-center bg-slate-50 rounded-lg py-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="text-xl font-bold text-slate-800 leading-none mt-0.5">
                    {new Date(ev.startsAt).getDate()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_COLORS[ev.type] ?? 'bg-slate-400'}`} />
                    <h3 className="text-sm font-bold text-slate-800 truncate">{ev.title}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
                      {EVENT_TYPE_LABELS[ev.type as EventType] ?? ev.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{fmtDay(ev.startsAt)} · {fmtTime(ev.startsAt)}</span>
                    {ev.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} /> {ev.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                  <Users size={14} className="text-slate-300" />
                  <span className="text-sm font-semibold">{ev._count?.rsvps ?? 0}</span>
                </div>
              </button>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">{total} events</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[92px] border-b border-r border-slate-50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = eventsByDay.get(day) ?? []
              return (
                <div key={day} className="min-h-[92px] border-b border-r border-slate-50 p-1.5">
                  <span
                    className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday(day) ? 'bg-[#1565D8] text-white' : 'text-slate-500'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="space-y-1 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setDetailId(ev.id)}
                        className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded hover:bg-blue-50"
                        title={ev.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_COLORS[ev.type] ?? 'bg-slate-400'}`} />
                        <span className="text-[10px] font-medium text-slate-600 truncate">{ev.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-400 pl-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <EventDrawer
        open={formOpen}
        event={editingEvent}
        onClose={() => setFormOpen(false)}
        onSaved={fetchEvents}
      />
      <EventDetailDrawer
        open={!!detailId}
        eventId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
        onDeleted={fetchEvents}
      />
    </div>
  )
}
