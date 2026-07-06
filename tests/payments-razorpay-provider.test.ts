import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { RazorpayProvider } from '@/lib/payments/providers/razorpay'

const provider = new RazorpayProvider()

const CREDS = { keyId: 'rzp_test_abc', keySecret: 'test_secret_xyz' }
const WEBHOOK_SECRET = 'whsec_golden_vector'

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

describe('verifyCheckoutSignature', () => {
  const input = {
    providerOrderId: 'order_MkKp2vFq9XjZ1a',
    providerPaymentId: 'pay_MkKqLmNo3PqR5t',
  }
  const validSignature = sign(`${input.providerOrderId}|${input.providerPaymentId}`, CREDS.keySecret)

  it('accepts a valid signature', () => {
    expect(provider.verifyCheckoutSignature({ ...input, signature: validSignature }, CREDS)).toBe(true)
  })

  it('rejects a wrong signature', () => {
    const wrong = sign('order_other|pay_other', CREDS.keySecret)
    expect(provider.verifyCheckoutSignature({ ...input, signature: wrong }, CREDS)).toBe(false)
  })

  it('rejects a signature made with a different secret', () => {
    const forged = sign(`${input.providerOrderId}|${input.providerPaymentId}`, 'attacker_secret')
    expect(provider.verifyCheckoutSignature({ ...input, signature: forged }, CREDS)).toBe(false)
  })

  it('rejects garbage / non-hex signatures without throwing', () => {
    expect(provider.verifyCheckoutSignature({ ...input, signature: '' }, CREDS)).toBe(false)
    expect(provider.verifyCheckoutSignature({ ...input, signature: 'zzzz-not-hex' }, CREDS)).toBe(false)
  })
})

describe('verifyWebhookSignature', () => {
  const rawBody = JSON.stringify({ event: 'payment.captured', payload: {} })

  it('accepts a valid raw-body signature', () => {
    expect(provider.verifyWebhookSignature(rawBody, sign(rawBody, WEBHOOK_SECRET), WEBHOOK_SECRET)).toBe(true)
  })

  it('rejects when the body was altered after signing', () => {
    const signature = sign(rawBody, WEBHOOK_SECRET)
    const altered = rawBody.replace('captured', 'failed')
    expect(provider.verifyWebhookSignature(altered, signature, WEBHOOK_SECRET)).toBe(false)
  })

  it('rejects a re-serialized body even with identical content', () => {
    // Same JSON, different whitespace — the legacy stringify-fallback would
    // have accepted this second surface; the new provider must not.
    const reserialized = JSON.stringify(JSON.parse(`{"event": "payment.captured",  "payload": {}}`))
    const signatureOverPretty = sign(`{"event": "payment.captured",  "payload": {}}`, WEBHOOK_SECRET)
    expect(provider.verifyWebhookSignature(reserialized, signatureOverPretty, WEBHOOK_SECRET)).toBe(false)
  })

  it('rejects wrong secret', () => {
    expect(provider.verifyWebhookSignature(rawBody, sign(rawBody, 'other_secret'), WEBHOOK_SECRET)).toBe(false)
  })
})

describe('parseWebhook', () => {
  it('normalizes payment.captured', () => {
    const body = JSON.stringify({
      id: 'evt_00000000000001',
      event: 'payment.captured',
      created_at: 1751795400,
      payload: {
        payment: {
          entity: {
            id: 'pay_MkKqLmNo3PqR5t',
            order_id: 'order_MkKp2vFq9XjZ1a',
            amount: 1400000,
            currency: 'INR',
            method: 'upi',
            status: 'captured',
          },
        },
      },
    })
    const evt = provider.parseWebhook(body)
    expect(evt).toMatchObject({
      providerEventId: 'evt_00000000000001',
      type: 'payment.captured',
      rawType: 'payment.captured',
      providerOrderId: 'order_MkKp2vFq9XjZ1a',
      providerPaymentId: 'pay_MkKqLmNo3PqR5t',
      amountMinor: 1400000,
      method: 'upi',
    })
    expect(evt.occurredAt.getTime()).toBe(1751795400 * 1000)
  })

  it('normalizes payment.failed with error details', () => {
    const evt = provider.parseWebhook(JSON.stringify({
      id: 'evt_00000000000002',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_failed01',
            order_id: 'order_x1',
            amount: 50000,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment declined by bank',
          },
        },
      },
    }))
    expect(evt.type).toBe('payment.failed')
    expect(evt.errorCode).toBe('BAD_REQUEST_ERROR')
    expect(evt.errorReason).toBe('Payment declined by bank')
  })

  it('normalizes refund.processed', () => {
    const evt = provider.parseWebhook(JSON.stringify({
      id: 'evt_00000000000003',
      event: 'refund.processed',
      payload: {
        refund: {
          entity: { id: 'rfnd_abc123', payment_id: 'pay_MkKqLmNo3PqR5t', amount: 400000 },
        },
      },
    }))
    expect(evt).toMatchObject({
      type: 'refund.processed',
      providerRefundId: 'rfnd_abc123',
      providerPaymentId: 'pay_MkKqLmNo3PqR5t',
      amountMinor: 400000,
    })
  })

  it('normalizes order.paid', () => {
    const evt = provider.parseWebhook(JSON.stringify({
      id: 'evt_00000000000004',
      event: 'order.paid',
      payload: { order: { entity: { id: 'order_MkKp2vFq9XjZ1a', amount: 1400000 } } },
    }))
    expect(evt.type).toBe('order.paid')
    expect(evt.providerOrderId).toBe('order_MkKp2vFq9XjZ1a')
  })

  it('maps unrecognized events to unknown, keeping rawType', () => {
    const evt = provider.parseWebhook(JSON.stringify({
      id: 'evt_00000000000005',
      event: 'settlement.processed',
      payload: {},
    }))
    expect(evt.type).toBe('unknown')
    expect(evt.rawType).toBe('settlement.processed')
  })

  it('builds a fallback event id when the body has none', () => {
    const evt = provider.parseWebhook(JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_noeventid', order_id: 'order_y' } } },
    }))
    expect(evt.providerEventId).toBe('payment.captured:pay_noeventid')
  })
})
