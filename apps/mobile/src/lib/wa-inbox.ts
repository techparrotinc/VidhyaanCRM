import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/**
 * Wire contract for GET /api/v1/whatsapp/inbox (composer-routed, mobile
 * Bearer already works) — read-only. NOTE: reply is not built, on either
 * surface — the web app has no freeform-send route either (outbound
 * WhatsApp only goes through the metered *template* system; a freeform
 * reply inside Meta's 24h customer-service window needs new Graph API
 * integration work, not just a mobile client). Don't wire a "Reply" button
 * that silently does nothing.
 */

export const inboundMessageSchema = z.object({
  id: z.string(),
  phone: z.string(),
  body: z.string(),
  createdAt: z.coerce.date(),
  contactName: z.string().nullable(),
  leadId: z.string().nullable(),
  admissionId: z.string().nullable()
})
export type InboundMessage = z.infer<typeof inboundMessageSchema>

const inboxResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(inboundMessageSchema)
})

export function useWhatsAppInbox() {
  return useQuery({
    queryKey: ['wa-inbox'],
    queryFn: async () => {
      const json = await api<unknown>('/api/v1/whatsapp/inbox')
      return inboxResponseSchema.parse(json).data
    }
  })
}
