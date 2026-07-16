import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for /api/v1/schedule* (course_schedule module). */

export const scheduleSessionSchema = z.object({
  id: z.string(),
  startsAt: z.coerce.date(),
  durationMin: z.number(),
  status: z.string(),
  meetingLink: z.string().nullable(),
  cancelReason: z.string().nullable(),
  attendanceSessionId: z.string().nullable(),
  course: z.object({ id: z.string(), name: z.string() }).nullable(),
  batch: z.object({ id: z.string(), name: z.string(), enrolledCount: z.number().catch(0) }).nullable(),
  teacher: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  markedCount: z.number().nullable(),
  canManage: z.boolean().catch(false)
})
export type ScheduleSession = z.infer<typeof scheduleSessionSchema>

const scheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ sessions: z.array(scheduleSessionSchema.passthrough()) })
})

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function useDaySchedule(date: Date) {
  return useQuery({
    queryKey: ['schedule', ymd(date)],
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/schedule?date=${ymd(date)}`)
      return scheduleResponseSchema.parse(json).data.sessions as ScheduleSession[]
    }
  })
}

/** ISO week key (YYYY-Www) for the week containing `d`. */
export function isoWeekOf(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function useWeekSchedule(week: string) {
  return useQuery({
    queryKey: ['schedule-week', week],
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/schedule?week=${week}`)
      return scheduleResponseSchema.parse(json).data.sessions as ScheduleSession[]
    }
  })
}

const sessionDetailResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ session: scheduleSessionSchema.passthrough() })
})

/** Fresh session by id — detail screen refetches so params can't go stale. */
export function useSession(id: string | undefined, initial?: ScheduleSession) {
  return useQuery({
    queryKey: ['schedule-session', id],
    enabled: !!id,
    initialData: initial,
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/schedule/sessions/${id}`)
      return sessionDetailResponseSchema.parse(json).data.session as ScheduleSession
    }
  })
}

export function useRescheduleSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; startsAt: string; durationMin: number; notifyGuardians: boolean }) =>
      api(`/api/v1/schedule/sessions/${args.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          startsAt: args.startsAt,
          durationMin: args.durationMin,
          notifyGuardians: args.notifyGuardians
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-week'] })
    }
  })
}

export function useCancelSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      api(`/api/v1/schedule/sessions/${args.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: args.reason })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-week'] })
    }
  })
}

export function useRemindSession() {
  return useMutation({
    mutationFn: (id: string) => api(`/api/v1/schedule/sessions/${id}/remind`, { method: 'POST' })
  })
}
