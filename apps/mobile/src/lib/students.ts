import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/v1/students (composer-routed, mobile Bearer
 *  already works) — read-only directory + contact actions. */

export const studentDirectoryEntrySchema = z.object({
  id: z.string(),
  studentCode: z.string(),
  name: z.string(),
  gradeLabel: z.string().nullable(),
  section: z.string().nullable(),
  guardianName: z.string().nullable(),
  guardianPhone: z.string().nullable(),
  status: z.string()
})
export type StudentDirectoryEntry = z.infer<typeof studentDirectoryEntrySchema>

const studentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(studentDirectoryEntrySchema),
  pagination: z.object({ total: z.number() })
})

export function useStudentDirectory(search: string, gradeLabel?: string, section?: string) {
  return useQuery({
    queryKey: ['students', search, gradeLabel ?? '', section ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30', status: 'ACTIVE' })
      if (search.trim()) params.set('search', search.trim())
      if (gradeLabel) params.set('gradeLabel', gradeLabel)
      if (section) params.set('section', section)
      const json = await api<unknown>(`/api/v1/students?${params}`)
      const parsed = studentsResponseSchema.parse(json)
      return { students: parsed.data, total: parsed.pagination.total }
    }
  })
}

/** Class chips from the class master (+ legacy strings) — options endpoint. */
const classOptionSchema = z.object({ name: z.string(), sections: z.array(z.string()) })
const classOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(classOptionSchema.passthrough())
})
export type ClassOption = z.infer<typeof classOptionSchema>

export function useClassOptions() {
  return useQuery({
    queryKey: ['class-options'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const json = await api<unknown>('/api/v1/options/classes')
      return classOptionsResponseSchema.parse(json).data
    }
  })
}

/** Student profile (wireframe s-student) — detail + open balance. */
const studentDetailSchema = studentDirectoryEntrySchema.extend({
  rollNumber: z.string().nullable().optional(),
  guardianEmail: z.string().nullable().optional(),
  invoices: z
    .array(
      z.object({
        id: z.string(),
        invoiceNumber: z.string(),
        totalAmount: z.coerce.number(),
        status: z.string(),
        dueDate: z.coerce.date().nullable()
      })
    )
    .catch([])
})
export type StudentDetail = z.infer<typeof studentDetailSchema>

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    enabled: !!id,
    queryFn: async () => {
      const json = await api<{ success: true; data: unknown }>(`/api/v1/students/${id}`)
      return studentDetailSchema.passthrough().parse((json as { data: unknown }).data) as StudentDetail
    }
  })
}
