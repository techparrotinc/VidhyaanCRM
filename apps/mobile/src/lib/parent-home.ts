import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/mobile/v1/parent/home. */

const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY'])

export const parentHomeKidSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  gradeLabel: z.string().nullable(),
  section: z.string().nullable(),
  orgName: z.string(),
  attendanceToday: attendanceStatusSchema.nullable(),
  nextFeeDue: z
    .object({
      invoiceId: z.string(),
      invoiceNumber: z.string(),
      dueDate: z.coerce.date().nullable(),
      balance: z.number()
    })
    .nullable(),
  nextEvent: z
    .object({
      title: z.string(),
      date: z.string(),
      startTime: z.string().nullable()
    })
    .nullable()
})

export const parentHomeResponseSchema = z.object({
  success: z.literal(true),
  kids: z.array(parentHomeKidSchema)
})

export type ParentHomeKid = z.infer<typeof parentHomeKidSchema>

async function fetchParentHome(): Promise<ParentHomeKid[]> {
  const json = await api<unknown>('/api/mobile/v1/parent/home')
  return parentHomeResponseSchema.parse(json).kids
}

export function useParentHome() {
  return useQuery({ queryKey: ['parent-home'], queryFn: fetchParentHome })
}
