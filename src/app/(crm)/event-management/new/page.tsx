'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EventForm, { EventPayload } from '@/components/events/EventForm'

export default function NewEventPage() {
  const router = useRouter()

  const create = async (payload: EventPayload, publish?: boolean) => {
    const res = await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || json.error || 'Failed to create event')
    }
    const eventId = json.data.id

    if (publish) {
      const pubRes = await fetch(`/api/v1/events/${eventId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })
      const pubJson = await pubRes.json()
      if (!pubRes.ok || pubJson.success === false) {
        // Draft is saved — land on it and surface why publishing failed
        router.push(`/event-management/${eventId}`)
        throw new Error(pubJson.error?.message || pubJson.error || 'Saved as draft, but publishing failed')
      }
      // Straight into the announce step
      router.push(`/event-management/${eventId}?announce=1`)
      return
    }

    router.push(`/event-management/${eventId}`)
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <Link href="/event-management"
          className="text-sm font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 mb-2">
          <ChevronLeft size={15} /> Events
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Event</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
          Events start as drafts — publish when you're ready to invite attendees.
        </p>
      </div>

      <EventForm
        submitLabel="Save Draft"
        showPublishAction
        onSubmit={create}
        onCancel={() => router.push('/event-management')}
      />
    </div>
  )
}
