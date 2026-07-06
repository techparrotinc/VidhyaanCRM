import crypto from 'crypto'
import type {
  PaymentProvider,
  DecryptedCredentials,
  CreateOrderInput,
  CreateOrderResult,
  CheckoutSignatureInput,
  NormalizedGatewayEvent,
  CreateRefundInput,
  CreateRefundResult,
  FetchPaymentsInput,
  FetchPaymentsResult
} from '../provider'

/**
 * Deterministic in-process gateway for tests and local dev. Selected only via
 * explicit opt-in (PAYMENT_PROVIDER_MOCK=1, never in production — see
 * registry.ts). Signatures use the same HMAC scheme as Razorpay so the
 * verification code paths are exercised for real.
 */
export class MockProvider implements PaymentProvider {
  readonly slug = 'RAZORPAY' as const // stands in for any provider in tests

  async verifyCredentials(creds: DecryptedCredentials): Promise<{ ok: boolean; error?: string }> {
    return creds.keySecret === 'bad_secret'
      ? { ok: false, error: 'Mock rejected credentials' }
      : { ok: true }
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const id = 'order_mock_' + crypto.createHash('sha256').update(input.receipt).digest('hex').slice(0, 14)
    return { providerOrderId: id, raw: { id, ...input, status: 'created' } }
  }

  verifyCheckoutSignature(input: CheckoutSignatureInput, creds: DecryptedCredentials): boolean {
    const expected = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${input.providerOrderId}|${input.providerPaymentId}`)
      .digest('hex')
    return expected === input.signature
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    return expected === signature
  }

  parseWebhook(rawBody: string): NormalizedGatewayEvent {
    const event = JSON.parse(rawBody)
    return {
      providerEventId: event.id ?? 'evt_mock_unknown',
      type: event.event ?? 'unknown',
      rawType: event.event ?? 'unknown',
      providerOrderId: event.orderId,
      providerPaymentId: event.paymentId,
      providerRefundId: event.refundId,
      amountMinor: event.amountMinor,
      method: event.method,
      occurredAt: new Date()
    }
  }

  async createRefund(input: CreateRefundInput): Promise<CreateRefundResult> {
    return {
      providerRefundId: 'rfnd_mock_' + input.providerPaymentId.slice(-8),
      status: 'pending'
    }
  }

  async fetchPayments(_input: FetchPaymentsInput): Promise<FetchPaymentsResult> {
    return { payments: [] }
  }
}
