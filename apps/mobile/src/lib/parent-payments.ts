import { z } from 'zod'
import { api } from './api'

/** Wire contract for the parent Razorpay checkout endpoints. */

const checkoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    gatewayOrderId: z.string(),
    providerOrderId: z.string(),
    keyId: z.string(),
    amountMinor: z.number(),
    currency: z.string(),
    environment: z.string(),
    prefill: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      contact: z.string().optional()
    })
  })
})

export type CheckoutOrder = z.infer<typeof checkoutResponseSchema>['data']

export async function createInvoiceCheckout(invoiceId: string, amount: number): Promise<CheckoutOrder> {
  const json = await api<unknown>(`/api/v1/parent/fees/invoices/${invoiceId}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
  return checkoutResponseSchema.parse(json).data
}

const confirmResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ receiptNumber: z.string(), duplicate: z.boolean() })
})

export async function confirmInvoiceCheckout(
  gatewayOrderId: string,
  payload: { providerOrderId: string; providerPaymentId: string; signature: string }
): Promise<{ receiptNumber: string; duplicate: boolean }> {
  const json = await api<unknown>(`/api/v1/parent/fees/checkout/${gatewayOrderId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return confirmResponseSchema.parse(json).data
}
