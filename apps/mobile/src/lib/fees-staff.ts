import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for the existing /api/v1/fees/* routes (composer-routed,
 *  mobile Bearer already works) — staff-side defaulter list + collection. */

export const overdueInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),
  dueDate: z.coerce.date().nullable(),
  student: z.object({
    id: z.string(),
    name: z.string(),
    studentCode: z.string(),
    gradeLabel: z.string().nullable(),
    guardianPhone: z.string().nullable()
  })
})
export type OverdueInvoice = z.infer<typeof overdueInvoiceSchema>

const overdueResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    invoices: z.array(overdueInvoiceSchema),
    count: z.number(),
    totalOverdue: z.number()
  })
})

export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['fees-overdue'],
    queryFn: async () => {
      const json = await api<unknown>('/api/v1/fees/overdue')
      return overdueResponseSchema.parse(json).data
    }
  })
}

/** New Fees-tab BFF: KPIs + every open invoice (overdue AND upcoming). */
export const openInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  balance: z.number(),
  dueDate: z.coerce.date().nullable(),
  daysOverdue: z.number(),
  status: z.string(),
  student: z.object({
    id: z.string(),
    name: z.string(),
    studentCode: z.string(),
    gradeLabel: z.string().nullable(),
    section: z.string().nullable(),
    guardianPhone: z.string().nullable()
  })
})
export type OpenInvoice = z.infer<typeof openInvoiceSchema>

const staffFeesResponseSchema = z.object({
  success: z.literal(true),
  kpis: z.object({ collectedToday: z.number(), openDues: z.number() }),
  invoices: z.array(openInvoiceSchema)
})
export type StaffFees = z.infer<typeof staffFeesResponseSchema>

export function useStaffFees() {
  return useQuery({
    queryKey: ['staff-fees'],
    queryFn: async () => {
      const json = await api<unknown>('/api/mobile/v1/staff/fees')
      return staffFeesResponseSchema.parse(json)
    }
  })
}

// Matches paymentSchema in /api/v1/fees/invoices/[id]/payments — the route
// the web admin UI actually calls (RAZORPAY/CARD excluded here: those are
// gateway-collected, not something staff manually key in on mobile).
const PAYMENT_METHODS = ['CASH', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'BANK_TRANSFER', 'OTHER'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { invoiceId: string; amount: number; method: PaymentMethod }) =>
      api(`/api/v1/fees/invoices/${args.invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: args.amount, method: args.method })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees-overdue'] })
      queryClient.invalidateQueries({ queryKey: ['staff-fees'] })
      queryClient.invalidateQueries({ queryKey: ['staff-home'] })
    }
  })
}

export function useSendPaymentLink() {
  return useMutation({
    mutationFn: async (invoiceId: string) =>
      api<{ success: true; data: { sent: boolean } }>(`/api/v1/fees/invoices/${invoiceId}/remind`, { method: 'POST' })
  })
}
