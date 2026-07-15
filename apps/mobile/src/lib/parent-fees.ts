import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/v1/parent/fees/invoices. */

export const invoiceItemSchema = z.object({
  head: z.string(),
  amount: z.number(),
  quantity: z.number()
})

export const parentInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  studentName: z.string(),
  gradeLabel: z.string().nullable(),
  schoolName: z.string(),
  institutionType: z.string(),
  invoiceType: z.string(),
  termName: z.string().nullable(),
  courseName: z.string().nullable(),
  createdAt: z.coerce.date(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  balance: z.number(),
  dueDate: z.coerce.date().nullable(),
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED', 'SCHEDULED', 'REFUNDED']),
  items: z.array(invoiceItemSchema),
  payable: z.boolean(),
  allowPartial: z.boolean(),
  minPartialAmount: z.number().nullable()
})

export const parentInvoicesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ invoices: z.array(parentInvoiceSchema) })
})

export type ParentInvoice = z.infer<typeof parentInvoiceSchema>

async function fetchParentInvoices(): Promise<ParentInvoice[]> {
  const json = await api<unknown>('/api/v1/parent/fees/invoices')
  return parentInvoicesResponseSchema.parse(json).data.invoices
}

export function useParentInvoices() {
  return useQuery({ queryKey: ['parent-invoices'], queryFn: fetchParentInvoices })
}

export const OPEN_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] as const
