import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/**
 * Wire contract for /api/admin/* (platform-role only). These routes predate
 * route() and call auth() directly — middleware.ts now rewrites the mobile
 * Bearer JWT to headers for this path prefix too, and the routes themselves
 * were patched to read x-user-id/x-user-role first (src/lib/admin-auth.ts),
 * same fix pattern as /api/v1/notifications and /api/v1/files/upload.
 */

const statsResponseSchema = z.object({
  organizations: z.object({
    total: z.number(),
    active: z.number(),
    trial: z.number(),
    newThisMonth: z.number(),
    newLastMonth: z.number()
  }),
  revenue: z.object({ mrr: z.number(), growthPct: z.number() }),
  ops: z.object({ uptimePct: z.number().nullable(), failedPaymentsThisWeek: z.number() })
})
export type AdminStats = z.infer<typeof statsResponseSchema>

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const json = await api<unknown>('/api/admin/stats')
      return statsResponseSchema.parse(json)
    }
  })
}

export const adminOrgSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.string(),
  trialEndsAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  plan: z.object({ name: z.string() }).nullable()
})
export type AdminOrg = z.infer<typeof adminOrgSchema>

const orgsResponseSchema = z.object({
  data: z.array(adminOrgSchema),
  pagination: z.object({ total: z.number() })
})

export function useAdminOrgs(status: string) {
  return useQuery({
    queryKey: ['admin-orgs', status],
    queryFn: async () => {
      const json = await api<unknown>(`/api/admin/organizations?status=${status}&limit=30`)
      return orgsResponseSchema.parse(json)
    }
  })
}

export function useOrgApprovalAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { orgId: string; status: 'ACTIVE' | 'SUSPENDED'; notes: string }) =>
      api(`/api/admin/organizations/${args.orgId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: args.status, notes: args.notes })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orgs'] })
  })
}

// ── WhatsApp shared-template moderation (view + toggle active; creating new
// templates stays a web-only builder flow) ──

export const sharedTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(),
  category: z.string(),
  isActive: z.boolean()
})
export type SharedTemplate = z.infer<typeof sharedTemplateSchema>

export function useSharedTemplates() {
  return useQuery({
    queryKey: ['admin-wa-templates'],
    queryFn: async () => {
      const json = await api<{ success: true; data: SharedTemplate[] }>('/api/admin/whatsapp-templates')
      return z.array(sharedTemplateSchema).parse(json.data)
    }
  })
}

export function useToggleTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; isActive: boolean }) =>
      api(`/api/admin/whatsapp-templates/${args.id}`, { method: 'PUT', body: JSON.stringify({ isActive: args.isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-wa-templates'] })
  })
}

// ── Review moderation (flags queue) ──

export const flaggedReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  flagReason: z.string().nullable(),
  parent: z.object({ name: z.string() }).nullable(),
  school: z.object({ name: z.string() }).nullable()
})
export type FlaggedReview = z.infer<typeof flaggedReviewSchema>

const reviewsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ reviews: z.array(flaggedReviewSchema), total: z.number() })
})

export function useFlaggedReviews() {
  return useQuery({
    queryKey: ['admin-flagged-reviews'],
    queryFn: async () => {
      const json = await api<unknown>('/api/admin/reviews?status=FLAGGED&limit=30')
      return reviewsResponseSchema.parse(json).data
    }
  })
}

export function useModerateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { reviewId: string; status: 'PUBLISHED' | 'REMOVED'; reason?: string }) =>
      api(`/api/admin/reviews/${args.reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: args.status, reason: args.reason })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-flagged-reviews'] })
  })
}

// ── Platform announcement publish ──

export function useSendAnnouncement() {
  return useMutation({
    mutationFn: async (args: { title: string; message: string; channel: 'IN_APP' | 'EMAIL' | 'BOTH' }) =>
      api('/api/admin/notify', {
        method: 'POST',
        body: JSON.stringify({ orgId: 'all', title: args.title, message: args.message, type: 'PLATFORM_ANNOUNCEMENT', channel: args.channel })
      })
  })
}
