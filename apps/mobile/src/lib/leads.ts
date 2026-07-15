import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/**
 * Wire contract for the existing /api/v1/leads* routes — these already run
 * through the route() composer, so the mobile Bearer JWT works via
 * middleware's header rewrite with zero backend changes (mobile-app-plan
 * §4.2). No mobile-only fork needed here, unlike /api/v1/notifications
 * (which predates the composer and needed a small patch).
 */

export const leadSchema = z.object({
  id: z.string(),
  leadCode: z.string(),
  parentName: z.string(),
  phone: z.string(),
  kidName: z.string().nullable(),
  status: z.string(),
  priority: z.string(),
  source: z.string(),
  gradeSought: z.string().nullable(),
  nextFollowUpAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  assignedTo: z.object({ id: z.string(), name: z.string() }).nullable()
})

export type Lead = z.infer<typeof leadSchema>

const leadsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(leadSchema),
  pagination: z.object({ total: z.number(), page: z.number(), limit: z.number(), hasNext: z.boolean() })
})

async function fetchLeads(search: string): Promise<{ leads: Lead[]; total: number }> {
  const params = new URLSearchParams({ limit: '30' })
  if (search.trim()) params.set('search', search.trim())
  const json = await api<unknown>(`/api/v1/leads?${params}`)
  const parsed = leadsResponseSchema.parse(json)
  return { leads: parsed.data, total: parsed.pagination.total }
}

export function useLeads(search: string) {
  return useQuery({ queryKey: ['leads', search], queryFn: () => fetchLeads(search) })
}

const quickAddSchema = z.object({
  parentName: z.string().min(2),
  phone: z.string().length(10),
  gradeSought: z.string().optional()
})
export type QuickAddLead = z.infer<typeof quickAddSchema>

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: QuickAddLead) => {
      quickAddSchema.parse(input)
      return api('/api/v1/leads', { method: 'POST', body: JSON.stringify(input) })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })
}

/** Logs a CALL/WHATSAPP touch — fired automatically after the native action opens. */
export function useLogLeadActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { leadId: string; type: 'CALL' | 'WHATSAPP' | 'NOTE'; summary: string }) =>
      api(`/api/v1/leads/${args.leadId}/activities`, {
        method: 'POST',
        body: JSON.stringify({ type: args.type, summary: args.summary })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })
}

export function useSnoozeLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { leadId: string; nextFollowUpAt: string }) =>
      api(`/api/v1/leads/${args.leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ nextFollowUpAt: args.nextFollowUpAt })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })
}
