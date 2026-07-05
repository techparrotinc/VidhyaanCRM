'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import EventForm, { EventPayload } from '@/components/events/EventForm'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/events/${id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setEvent(json.data) })
      .finally(() => setLoading(false))
  }, [id])

  const update = async (payload: EventPayload) => {
    const res = await fetch(`/api/v1/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || json.error || 'Failed to save changes')
    }
    router.push(`/event-management/${id}`)
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <Link href={`/event-management/${id}`}
          className="text-sm font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 mb-2">
          <ChevronLeft size={15} /> Back to event
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Event</h1>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !event ? (
        <p className="text-sm text-slate-400">Event not found.</p>
      ) : event.status !== 'DRAFT' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-slate-700">
            {event.status === 'PUBLISHED' ? 'Published events cannot be edited' : 'Cancelled events cannot be edited'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {event.status === 'PUBLISHED' ? 'Cancel the event if it is no longer happening.' : 'Create a new event instead.'}
          </p>
          <Link href={`/event-management/${id}`}
            className="text-sm font-semibold text-[#1565D8] hover:underline mt-3 inline-block">
            Back to event →
          </Link>
        </div>
      ) : (
        <EventForm
          initial={event}
          submitLabel="Save Changes"
          onSubmit={update}
          onCancel={() => router.push(`/event-management/${id}`)}
        />
      )}
    </div>
  )
}
