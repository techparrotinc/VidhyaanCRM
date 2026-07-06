import type { GatewayProvider } from '@prisma/client'

/**
 * Provider-agnostic payment gateway contract. Fee Management and all API
 * routes consume only these types — provider-specific payloads never cross
 * this boundary. Adding a gateway = one implementation file + a registry
 * entry (docs/design/payment-gateway-integration.md §6, §15).
 */

export type DecryptedCredentials = {
  keyId: string
  keySecret: string
}

/** Amounts crossing the provider boundary are integer minor units (paise). */
export type CreateOrderInput = {
  amountMinor: number
  currency: string
  receipt: string
  /** orgId, invoiceId, gatewayOrderId, studentId — audit trail on the provider object */
  notes: Record<string, string>
}

export type CreateOrderResult = {
  providerOrderId: string
  raw: unknown
}

export type CheckoutSignatureInput = {
  providerOrderId: string
  providerPaymentId: string
  signature: string
}

export type NormalizedEventType =
  | 'payment.captured'
  | 'payment.failed'
  | 'refund.processed'
  | 'refund.failed'
  | 'order.paid'
  | 'unknown'

export type NormalizedGatewayEvent = {
  providerEventId: string
  type: NormalizedEventType
  /** Raw provider event name, kept for logging/forensics */
  rawType: string
  providerOrderId?: string
  providerPaymentId?: string
  providerRefundId?: string
  amountMinor?: number
  /** Provider's payment method label (upi/card/netbanking/…) */
  method?: string
  errorCode?: string
  errorReason?: string
  occurredAt: Date
}

export type NormalizedPayment = {
  providerPaymentId: string
  providerOrderId?: string
  status: 'captured' | 'failed' | 'refunded' | 'pending'
  amountMinor: number
  currency: string
  method?: string
  createdAt: Date
}

export type CreateRefundInput = {
  providerPaymentId: string
  amountMinor: number
  notes: Record<string, string>
}

export type CreateRefundResult = {
  providerRefundId: string
  status: 'pending' | 'processed'
}

export type FetchPaymentsInput = {
  from: Date
  to: Date
  cursor?: string
}

export type FetchPaymentsResult = {
  payments: NormalizedPayment[]
  nextCursor?: string
}

export interface PaymentProvider {
  readonly slug: GatewayProvider

  /** Zero-side-effect authenticated call proving the credentials work. */
  verifyCredentials(creds: DecryptedCredentials): Promise<{ ok: boolean; error?: string }>

  createOrder(input: CreateOrderInput, creds: DecryptedCredentials): Promise<CreateOrderResult>

  /** Browser checkout callback signature (UX fast path — webhook stays source of truth). */
  verifyCheckoutSignature(input: CheckoutSignatureInput, creds: DecryptedCredentials): boolean

  /** MUST be computed over the raw request body, never a re-serialization. */
  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean

  parseWebhook(rawBody: string): NormalizedGatewayEvent

  createRefund(input: CreateRefundInput, creds: DecryptedCredentials): Promise<CreateRefundResult>

  /** Reconciliation: page through provider-side payments for a window. */
  fetchPayments(input: FetchPaymentsInput, creds: DecryptedCredentials): Promise<FetchPaymentsResult>
}
