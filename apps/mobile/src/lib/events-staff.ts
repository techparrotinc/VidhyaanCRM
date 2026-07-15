import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api, uploadFile } from './api'

/** Wire contract for the existing /api/v1/events* routes (composer-routed,
 *  mobile Bearer already works). Reduced scope vs web: create → publish →
 *  announce (portal + WhatsApp only), no edit/delete/full audience picker. */

export const staffEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']),
  startsAt: z.coerce.date(),
  location: z.string().nullable(),
  imageUrl: z.string().nullable()
})
export type StaffEvent = z.infer<typeof staffEventSchema>

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      title: string
      startsAt: string // ISO
      description?: string
      location?: string
      imageUrl?: string
    }) => {
      const json = await api<{ success: true; data: StaffEvent }>('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify(args)
      })
      return staffEventSchema.parse(json.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  })
}

export function useUploadEventCover() {
  return useMutation({
    mutationFn: async (args: { uri: string; fileName: string; mimeType: string }) =>
      uploadFile({ uri: args.uri, fileName: args.fileName, mimeType: args.mimeType, category: 'events' })
  })
}

export function usePublishEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      const json = await api<unknown>(`/api/v1/events/${eventId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'publish' })
      })
      return staffEventSchema.parse((json as { data: unknown }).data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  })
}

const audienceSchema = z.object({
  success: z.literal(true),
  data: z.object({ parents: z.number(), leads: z.number(), both: z.number() })
})

export function useAnnounceAudience(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['event-announce-audience', eventId],
    enabled,
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/events/${eventId}/announce`)
      return audienceSchema.parse(json).data
    }
  })
}

export function useAnnounceEvent() {
  return useMutation({
    mutationFn: async (args: { eventId: string; channels: Array<'PORTAL' | 'WHATSAPP'> }) =>
      api(`/api/v1/events/${args.eventId}/announce`, {
        method: 'POST',
        body: JSON.stringify({ audience: 'ALL', channels: args.channels })
      })
  })
}
