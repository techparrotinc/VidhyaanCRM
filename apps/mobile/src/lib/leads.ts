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

// Defensive against legacy rows: real orgs have leads predating today's
// invariants (null names, missing assignee) — one bad row must not blank
// the whole tab.
export const leadSchema = z.object({
  id: z.string(),
  leadCode: z.string().catch(''),
  parentName: z.string().catch('Unknown'),
  phone: z.string().catch(''),
  kidName: z.string().nullable().catch(null),
  status: z.string().catch('NEW'),
  priority: z.string().catch('MEDIUM'),
  source: z.string().catch('OTHER'),
  gradeSought: z.string().nullable().catch(null),
  nextFollowUpAt: z.coerce.date().nullable().catch(null),
  createdAt: z.coerce.date().catch(() => new Date()),
  assignedTo: z.object({ id: z.string(), name: z.string() }).nullable().catch(null)
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

const leadActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  summary: z.string(),
  createdAt: z.coerce.date(),
  performedByName: z.string().nullable().optional()
})
export type LeadActivity = z.infer<typeof leadActivitySchema>

const leadDetailSchema = leadSchema.extend({
  email: z.string().nullable(),
  source: z.string(),
  activities: z.array(leadActivitySchema.passthrough()).catch([])
})
export type LeadDetail = z.infer<typeof leadDetailSchema>

const leadDetailResponseSchema = z.object({ success: z.literal(true), data: leadDetailSchema.passthrough() })

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/leads/${id}`)
      return leadDetailResponseSchema.parse(json).data as LeadDetail
    },
    enabled: !!id
  })
}

/** Follow-up outcome → lead status + optional next follow-up, plus a NOTE activity. */
export function useLogFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      leadId: string
      status?: string
      nextFollowUpAt?: string | null
      note?: string
    }) => {
      if (args.status || args.nextFollowUpAt !== undefined) {
        await api(`/api/v1/leads/${args.leadId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...(args.status ? { status: args.status } : {}),
            ...(args.nextFollowUpAt !== undefined ? { nextFollowUpAt: args.nextFollowUpAt } : {})
          })
        })
      }
      if (args.note?.trim()) {
        await api(`/api/v1/leads/${args.leadId}/activities`, {
          method: 'POST',
          body: JSON.stringify({ type: 'NOTE', summary: args.note.trim() })
        })
      }
    },
    onSuccess: (_d, args) => {
      queryClient.invalidateQueries({ queryKey: ['lead', args.leadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
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
