import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/**
 * Wire contract for GET/PUT /api/v1/notifications — the same route the web
 * parent portal uses. It's outside the route() composer (calls auth()
 * directly) but reads the mobile Bearer JWT via middleware's x-user-id
 * rewrite, so no mobile-only fork was needed here.
 */

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date()
})

export type NotificationItem = z.infer<typeof notificationSchema>

const notificationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(notificationSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    unreadCount: z.number()
  })
})

async function fetchNotifications(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const json = await api<unknown>('/api/v1/notifications?limit=50')
  const parsed = notificationsResponseSchema.parse(json)
  return { items: parsed.data, unreadCount: parsed.pagination.unreadCount }
}

export function useParentNotifications() {
  return useQuery({ queryKey: ['parent-notifications'], queryFn: fetchNotifications })
}

/** Lightweight unread-count-only poll for the Home bell badge. */
export function useUnreadNotificationCount() {
  const { data } = useQuery({
    queryKey: ['parent-notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000
  })
  return data?.unreadCount ?? 0
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { ids?: string[]; all?: boolean }) =>
      api('/api/v1/notifications', { method: 'PUT', body: JSON.stringify(args) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parent-notifications'] })
  })
}
