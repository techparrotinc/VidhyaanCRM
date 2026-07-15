import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/**
 * Wire contract for the existing /api/v1/attendance/* routes (composer-
 * routed, mobile Bearer already works). Same dual-mode split as the web
 * register page: school orgs mark by grade+section, LC/coaching orgs mark
 * by course/batch session.
 */

export function useInstitutionMode() {
  const [mode, setMode] = useState<'school' | 'lc' | null>(null)
  useEffect(() => {
    let cancelled = false
    api<{ data?: { institutionType?: string } }>('/api/v1/settings/org-type')
      .then((json) => {
        if (cancelled) return
        const t = (json?.data?.institutionType ?? '').toUpperCase()
        const lc = ['LEARNING_CENTER', 'COACHING_CENTER', 'SKILL_DEVELOPMENT', 'SPORTS_ACADEMY'].includes(t)
        setMode(lc ? 'lc' : 'school')
      })
      .catch(() => !cancelled && setMode('school'))
    return () => {
      cancelled = true
    }
  }, [])
  return mode
}

const classCardSchema = z.object({
  gradeLabel: z.string(),
  section: z.string().nullable(),
  students: z.number(),
  marked: z.number(),
  present: z.number(),
  absent: z.number()
})
export type ClassCard = z.infer<typeof classCardSchema>

export function useAttendanceOverview(date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['attendance-overview', date],
    enabled,
    queryFn: async () => {
      const json = await api<{ data: { classes: ClassCard[] } }>(`/api/v1/attendance/overview?date=${date}`)
      return json.data.classes
    }
  })
}

const sessionCardSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  startsAt: z.coerce.date().nullable(),
  course: z.object({ id: z.string(), name: z.string() }).nullable(),
  batch: z.object({ id: z.string(), name: z.string() }).nullable(),
  _count: z.object({ records: z.number() })
})
export type SessionCard = z.infer<typeof sessionCardSchema>

export function useAttendanceSessions(date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['attendance-sessions', date],
    enabled,
    queryFn: async () => {
      const json = await api<{ data: { sessions: SessionCard[] } }>(`/api/v1/attendance/sessions?date=${date}`)
      return json.data.sessions
    }
  })
}

export type RegisterTarget =
  | { kind: 'class'; gradeLabel: string; section: string | null; label: string }
  | { kind: 'session'; sessionId: string; label: string }

export const rosterStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  studentCode: z.string(),
  rollNumber: z.string().nullable(),
  section: z.string().nullable()
})
export type RosterStudent = z.infer<typeof rosterStudentSchema>

export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY'])
export type AttendanceStatusValue = z.infer<typeof attendanceStatusSchema>

const existingMarkSchema = z.object({
  studentId: z.string(),
  status: attendanceStatusSchema,
  note: z.string().nullable()
})
export type ExistingMark = z.infer<typeof existingMarkSchema>

export function useRegister(target: RegisterTarget | null, date: string) {
  return useQuery({
    queryKey: ['attendance-register', target, date],
    enabled: !!target,
    queryFn: async () => {
      const params = new URLSearchParams({ date })
      if (target!.kind === 'class') {
        params.set('gradeLabel', target!.gradeLabel)
        if (target!.section) params.set('section', target!.section)
        else params.set('unsectioned', 'true')
      } else {
        params.set('sessionId', target!.sessionId)
      }
      const json = await api<{
        data: { roster: RosterStudent[]; marks: ExistingMark[]; holiday: { name: string } | null; isWorkingDay: boolean }
      }>(`/api/v1/attendance/register?${params}`)
      return json.data
    }
  })
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      date: string
      sessionId?: string
      entries: Array<{ studentId: string; status: AttendanceStatusValue; note?: string }>
    }) => api('/api/v1/attendance/register', { method: 'POST', body: JSON.stringify(args) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-register'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-overview'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] })
    }
  })
}
