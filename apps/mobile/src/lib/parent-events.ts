import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/v1/parent/events + RSVP mutation. */

export const rsvpStatusSchema = z.enum(['GOING', 'MAYBE', 'NOT_GOING', 'ATTENDED'])

export const parentEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable(),
  location: z.string().nullable(),
  meetingLink: z.string().nullable(),
  imageUrl: z.string().nullable(),
  capacity: z.number().nullable(),
  orgName: z.string(),
  myRsvp: z.object({ id: z.string(), status: rsvpStatusSchema }).nullable(),
  _count: z.object({ rsvps: z.number() })
})

const eventsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(parentEventSchema)
})

export type ParentEvent = z.infer<typeof parentEventSchema>

async function fetchParentEvents(): Promise<ParentEvent[]> {
  const json = await api<unknown>('/api/v1/parent/events')
  return eventsResponseSchema.parse(json).data
}

export function useParentEvents() {
  return useQuery({ queryKey: ['parent-events'], queryFn: fetchParentEvents })
}

export function useRsvp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'GOING' | 'NOT_GOING' }) =>
      api(`/api/v1/parent/events/${eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parent-events'] })
  })
}
