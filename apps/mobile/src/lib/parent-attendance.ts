import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/v1/parent/attendance. */

export const attendanceStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  gradeLabel: z.string().nullable(),
  section: z.string().nullable(),
  organization: z.object({ name: z.string() })
})

const studentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ students: z.array(attendanceStudentSchema) })
})

export type AttendanceStudent = z.infer<typeof attendanceStudentSchema>

export function useAttendanceStudents() {
  return useQuery({
    queryKey: ['parent-attendance-students'],
    queryFn: async () => {
      const json = await api<unknown>('/api/v1/parent/attendance')
      return studentsResponseSchema.parse(json).data.students
    }
  })
}

const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY'])

export const attendanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  sessionId: z.string().nullable(),
  status: attendanceStatusSchema,
  note: z.string().nullable()
})

const monthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    student: attendanceStudentSchema,
    records: z.array(attendanceRecordSchema),
    stats: z.object({
      workingDays: z.number(),
      present: z.number(),
      absent: z.number(),
      halfDay: z.number(),
      leave: z.number(),
      holiday: z.number(),
      percentage: z.number().nullable()
    })
  })
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>
export type AttendanceMonth = z.infer<typeof monthResponseSchema>['data']

export function useAttendanceMonth(studentId: string | null, month: string) {
  return useQuery({
    queryKey: ['parent-attendance-month', studentId, month],
    queryFn: async () => {
      const json = await api<unknown>(
        `/api/v1/parent/attendance?studentId=${studentId}&month=${month}`
      )
      return monthResponseSchema.parse(json).data
    },
    enabled: !!studentId
  })
}
