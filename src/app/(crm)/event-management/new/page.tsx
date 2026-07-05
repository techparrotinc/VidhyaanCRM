'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EventForm, { EventPayload } from '@/components/events/EventForm'

export default function NewEventPage() {
  const router = useRouter()

  const create = async (payload: EventPayload) => {
    const res = await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || json.error || 'Failed to create event')
    }
    router.push(`/event-management/${json.data.id}`)
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
        onSubmit={create}
        onCancel={() => router.push('/event-management')}
      />
    </div>
  )
}
