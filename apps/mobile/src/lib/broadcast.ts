import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for the existing /api/v1/campaigns* + whatsapp-templates
 *  routes (composer-routed, mobile Bearer already works). Reduced scope vs
 *  web campaign composer: WhatsApp only, template picker + audience count,
 *  no per-recipient param customization, no scheduling. */

export const broadcastTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string()
})
export type BroadcastTemplate = z.infer<typeof broadcastTemplateSchema>

export function useAdoptedTemplates() {
  return useQuery({
    queryKey: ['wa-templates'],
    queryFn: async () => {
      const json = await api<{ success: true; data: BroadcastTemplate[] }>('/api/v1/settings/whatsapp-templates')
      return z
        .array(broadcastTemplateSchema)
        .parse(json.data)
        .filter((t) => t.status === 'VERIFIED' || t.status === 'SYNCED')
    }
  })
}

export const audiencePool = ['LEADS', 'STUDENTS', 'BOTH'] as const
export type AudiencePool = (typeof audiencePool)[number]

export function useAudienceCount(pool: AudiencePool) {
  return useQuery({
    queryKey: ['audience-count', pool],
    queryFn: async () => {
      const json = await api<{ success: true; data: { total: number } }>(`/api/v1/campaigns/audience-count?pool=${pool}`)
      return json.data.total
    }
  })
}

export function useSendBroadcast() {
  return useMutation({
    mutationFn: async (args: { name: string; pool: AudiencePool; whatsappTemplateId: string }) => {
      const created = await api<{ success: true; data: { id: string } }>('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          channel: 'WHATSAPP',
          whatsappTemplateId: args.whatsappTemplateId,
          audienceFilter: { pool: args.pool }
        })
      })
      return api(`/api/v1/campaigns/${created.data.id}/send`, { method: 'POST', body: JSON.stringify({}) })
    }
  })
}
