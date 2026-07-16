import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/mobile/v1/staff/home. */

const tileSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  hint: z.string().optional(),
  route: z.string().optional()
})

const attentionItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  subtitle: z.string(),
  route: z.string()
})

export type StaffHomeTile = z.infer<typeof tileSchema>
export type StaffAttentionItem = z.infer<typeof attentionItemSchema>

const staffHomeResponseSchema = z.object({
  success: z.literal(true),
  role: z.string(),
  institutionType: z.string().catch('SCHOOL'),
  unread: z.number().catch(0),
  tiles: z.array(tileSchema),
  attention: z.array(attentionItemSchema)
})

export type StaffHome = z.infer<typeof staffHomeResponseSchema>

async function fetchStaffHome(): Promise<StaffHome> {
  const json = await api<unknown>('/api/mobile/v1/staff/home')
  return staffHomeResponseSchema.parse(json)
}

export function useStaffHome() {
  return useQuery({ queryKey: ['staff-home'], queryFn: fetchStaffHome })
}
