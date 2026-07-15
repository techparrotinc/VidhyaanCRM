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

export function useStudentDirectory(search: string) {
  return useQuery({
    queryKey: ['students', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30', status: 'ACTIVE' })
      if (search.trim()) params.set('search', search.trim())
      const json = await api<unknown>(`/api/v1/students?${params}`)
      const parsed = studentsResponseSchema.parse(json)
      return { students: parsed.data, total: parsed.pagination.total }
    }
  })
}
