import Razorpay from 'razorpay'
import crypto from 'crypto'
import type {
  PaymentProvider,
  DecryptedCredentials,
  CreateOrderInput,
  CreateOrderResult,
  CheckoutSignatureInput,
  NormalizedGatewayEvent,
  NormalizedEventType,
  CreateRefundInput,
  CreateRefundResult,
  FetchPaymentsInput,
  FetchPaymentsResult,
  NormalizedPayment
} from '../provider'

/**
 * The only file in the codebase allowed to import the 'razorpay' SDK for fee
 * collection. No mock fallbacks here — a misconfigured account must fail
 * loudly, never silently succeed (the legacy integration's 401→mock fallback
 * is deliberately not carried over).
 */

function client(creds: DecryptedCredentials): Razorpay {
  return new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret })
}

function timingSafeHexMatch(expectedHex: string, providedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex')
    const b = Buffer.from(providedHex, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

const EVENT_TYPE_MAP: Record<string, NormalizedEventType> = {
  'payment.captured': 'payment.captured',
  'payment.failed': 'payment.failed',
  'refund.processed': 'refund.processed',
  'refund.failed': 'refund.failed',
  'order.paid': 'order.paid'
}

export class RazorpayProvider implements PaymentProvider {
  readonly slug = 'RAZORPAY' as const

  async verifyCredentials(creds: DecryptedCredentials): Promise<{ ok: boolean; error?: string }> {
    try {
      // Read-only authenticated call; proves key pair works without side effects.
      await client(creds).payments.all({ count: 1 })
      return { ok: true }
    } catch (error: unknown) {
      const err = error as { statusCode?: number; error?: { description?: string } }
      if (err.statusCode === 401) {
        return { ok: false, error: 'Razorpay rejected these keys. Check the Key ID and Secret match the selected mode (Test/Live).' }
      }
      return { ok: false, error: err.error?.description || 'Could not reach Razorpay to verify the keys. Try again.' }
    }
  }

  async createOrder(input: CreateOrderInput, creds: DecryptedCredentials): Promise<CreateOrderResult> {
    const order = await client(creds).orders.create({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes
    })
    return { providerOrderId: order.id, raw: order }
  }

  verifyCheckoutSignature(input: CheckoutSignatureInput, creds: DecryptedCredentials): boolean {
    const expected = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${input.providerOrderId}|${input.providerPaymentId}`)
      .digest('hex')
    return timingSafeHexMatch(expected, input.signature)
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    // Raw body only — never a re-serialization of the parsed payload.
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    return timingSafeHexMatch(expected, signature)
  }

  parseWebhook(rawBody: string): NormalizedGatewayEvent {
    const event = JSON.parse(rawBody)
    const rawType: string = event.event ?? 'unknown'
    const type = EVENT_TYPE_MAP[rawType] ?? 'unknown'
    const payment = event.payload?.payment?.entity
    const refund = event.payload?.refund?.entity
    const order = event.payload?.order?.entity

    return {
      // Razorpay sends a unique event id header (x-razorpay-event-id); the
      // body carries created_at + entity ids. The processor prefers the
      // header; this is the in-body fallback.
      providerEventId: event.id ?? `${rawType}:${payment?.id ?? refund?.id ?? order?.id ?? 'unknown'}`,
      type,
      rawType,
      providerOrderId: payment?.order_id ?? order?.id ?? undefined,
      providerPaymentId: payment?.id ?? refund?.payment_id ?? undefined,
      providerRefundId: refund?.id ?? undefined,
      amountMinor: typeof (refund?.amount ?? payment?.amount) === 'number'
        ? (refund?.amount ?? payment?.amount)
        : undefined,
      method: payment?.method ?? undefined,
      errorCode: payment?.error_code ?? undefined,
      errorReason: payment?.error_description ?? payment?.error_reason ?? undefined,
      occurredAt: event.created_at ? new Date(event.created_at * 1000) : new Date()
    }
  }

  async createRefund(input: CreateRefundInput, creds: DecryptedCredentials): Promise<CreateRefundResult> {
    const refund = await client(creds).payments.refund(input.providerPaymentId, {
      amount: input.amountMinor,
      notes: input.notes
    })
    return {
      providerRefundId: refund.id,
      status: refund.status === 'processed' ? 'processed' : 'pending'
    }
  }

  async fetchPayments(input: FetchPaymentsInput, creds: DecryptedCredentials): Promise<FetchPaymentsResult> {
    const PAGE_SIZE = 100
    const skip = input.cursor ? Number(input.cursor) : 0
    const res = await client(creds).payments.all({
      from: Math.floor(input.from.getTime() / 1000),
      to: Math.floor(input.to.getTime() / 1000),
      count: PAGE_SIZE,
      skip
    })
    const payments: NormalizedPayment[] = res.items.map((p) => ({
      providerPaymentId: p.id,
      providerOrderId: p.order_id ?? undefined,
      status: p.status === 'captured' ? 'captured'
        : p.status === 'failed' ? 'failed'
        : p.status === 'refunded' ? 'refunded'
        : 'pending',
      amountMinor: Number(p.amount),
      currency: p.currency,
      method: p.method,
      createdAt: new Date(Number(p.created_at) * 1000)
    }))
    return {
      payments,
      nextCursor: res.items.length === PAGE_SIZE ? String(skip + PAGE_SIZE) : undefined
    }
  }
}
