import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contracts for the new staff BFF endpoints: notifications feed,
 *  collections summary (M/Q/Y) and global search. */

// ---- Notifications ----

const staffNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  data: z.record(z.unknown()).nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date()
})
export type StaffNotification = z.infer<typeof staffNotificationSchema>

const notificationsResponseSchema = z.object({
  success: z.literal(true),
  unread: z.number(),
  notifications: z.array(staffNotificationSchema)
})

export function useStaffNotifications(category?: string) {
  return useQuery({
    queryKey: ['staff-notifications', category ?? 'all'],
    queryFn: async () => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : ''
      const json = await api<unknown>(`/api/mobile/v1/staff/notifications${qs}`)
      return notificationsResponseSchema.parse(json)
    }
  })
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api('/api/mobile/v1/staff/notifications', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['staff-home'] })
    }
  })
}

// ---- Collections ----

const periodSchema = z.object({
  label: z.string(),
  amount: z.number(),
  prevLabel: z.string(),
  prevAmount: z.number(),
  deltaPct: z.number().nullable()
})
export type CollectionsPeriod = z.infer<typeof periodSchema>

const collectionsResponseSchema = z.object({
  success: z.literal(true),
  month: periodSchema,
  quarter: periodSchema,
  year: periodSchema
})
export type Collections = z.infer<typeof collectionsResponseSchema>

export function useCollections(enabled = true) {
  return useQuery({
    queryKey: ['staff-collections'],
    enabled,
    queryFn: async () => {
      const json = await api<unknown>('/api/mobile/v1/staff/collections')
      return collectionsResponseSchema.parse(json)
    }
  })
}

// ---- Global search ----

const searchResponseSchema = z.object({
  success: z.literal(true),
  students: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      gradeLabel: z.string().nullable(),
      section: z.string().nullable(),
      guardianName: z.string().nullable(),
      studentCode: z.string()
    })
  ),
  leads: z.array(
    z.object({
      id: z.string(),
      parentName: z.string(),
      kidName: z.string().nullable(),
      gradeSought: z.string().nullable(),
      status: z.string(),
      createdAt: z.coerce.date()
    })
  ),
  invoices: z.array(
    z.object({
      id: z.string(),
      invoiceNumber: z.string(),
      studentId: z.string(),
      studentName: z.string(),
      balance: z.number(),
      status: z.string()
    })
  )
})
export type GlobalSearchResults = z.infer<typeof searchResponseSchema>

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ['global-search', q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const json = await api<unknown>(`/api/mobile/v1/staff/search?q=${encodeURIComponent(q.trim())}`)
      return searchResponseSchema.parse(json)
    }
  })
}
