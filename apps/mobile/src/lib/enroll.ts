import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contracts for the enrol wizard: courses + batches masters, student
 *  create, course enrollment (server creates the first invoice). */

const courseSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.coerce.number(),
  frequency: z.string(),
  billingDay: z.number(),
  durationMonths: z.number().nullable()
})
export type EnrollCourse = z.infer<typeof courseSchema>

export function useCourses() {
  return useQuery({
    queryKey: ['enroll-courses'],
    queryFn: async () => {
      const json = await api<{ success: true; data: unknown[] }>('/api/v1/settings/courses')
      return z.array(courseSchema.passthrough()).parse((json as { data: unknown[] }).data) as EnrollCourse[]
    }
  })
}

const batchSchema = z.object({
  id: z.string(),
  name: z.string(),
  daysOfWeek: z.array(z.string()).catch([]),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  course: z.object({ id: z.string(), name: z.string() }).nullable()
})
export type EnrollBatch = z.infer<typeof batchSchema>

export function useBatches() {
  return useQuery({
    queryKey: ['enroll-batches'],
    queryFn: async () => {
      const json = await api<{ success: true; data: { batches: unknown[] } }>('/api/v1/options/batches')
      return z.array(batchSchema.passthrough()).parse((json as { data: { batches: unknown[] } }).data.batches) as EnrollBatch[]
    }
  })
}

export function useEnrollStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      gradeLabel?: string
      guardianName: string
      guardianPhone: string
      batchId?: string
      courseId: string
      startDate: string
    }) => {
      const created = await api<{ success: true; data: { id: string; name: string } }>('/api/v1/students', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          gradeLabel: input.gradeLabel || undefined,
          guardianName: input.guardianName,
          guardianPhone: input.guardianPhone,
          batchId: input.batchId
        })
      })
      const studentId = (created as { data: { id: string } }).data.id
      await api(`/api/v1/students/${studentId}/enrollments`, {
        method: 'POST',
        body: JSON.stringify({ courseId: input.courseId, startDate: input.startDate })
      })
      return { studentId, studentName: input.name }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['staff-home'] })
    }
  })
}
