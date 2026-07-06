import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import crypto from 'crypto'

const db = vi.hoisted(() => ({
  paymentGatewayConfig: { findMany: vi.fn(), update: vi.fn() },
  webhookEvent: { create: vi.fn(), update: vi.fn() },
  gatewayOrder: { findFirst: vi.fn(), update: vi.fn() },
  payment: { findFirst: vi.fn() },
  invoice: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() }
}))
const redisMock = vi.hoisted(() => ({
  get: vi.fn(async (): Promise<string | null> => null),
  set: vi.fn(async () => 'OK')
}))
const applyGatewayPayment = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({ prisma: db }))
vi.mock('@/lib/redis', () => ({ redis: redisMock }))
vi.mock('@/lib/payments/checkout', () => ({ applyGatewayPayment }))

import { processGatewayWebhook } from '@/lib/payments/webhook-processor'
import { encryptSecret } from '@/lib/payments/vault'

const ORG = 'org_1'
const WEBHOOK_SECRET = 'whsec_test_secret'

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY ??= crypto.randomBytes(32).toString('base64')
  delete process.env.PAYMENT_PROVIDER_MOCK // exercise the real RazorpayProvider verification
})

function sign(body: string): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
}

function capturedBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: 'evt_1',
    event: 'payment.captured',
    created_at: 1751795400,
    payload: {
      payment: {
        entity: {
          id: 'pay_1',
          order_id: 'order_prov_1',
          amount: 2400000,
          method: 'upi',
          ...overrides
        }
      }
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  redisMock.get.mockResolvedValue(null)
  db.paymentGatewayConfig.findMany.mockResolvedValue([{
    id: 'cfg_1',
    orgId: ORG,
    provider: 'RAZORPAY',
    environment: 'TEST',
    webhookSecretEnc: encryptSecret(WEBHOOK_SECRET),
    webhookVerifiedAt: null,
    deletedAt: null
  }])
  db.paymentGatewayConfig.update.mockResolvedValue({})
  db.webhookEvent.create.mockImplementation(async ({ data }: any) => ({ id: 'evt_row_1', ...data }))
  db.webhookEvent.update.mockResolvedValue({})
  db.gatewayOrder.findFirst.mockResolvedValue({
    id: 'gwo_1',
    orgId: ORG,
    invoiceId: 'inv_1',
    providerOrderId: 'order_prov_1',
    amount: 24000,
    status: 'CREATED'
  })
  db.user.findFirst.mockResolvedValue(null) // skip notification path
  applyGatewayPayment.mockResolvedValue({ paymentId: 'pay_row', receiptNumber: 'RCP-2026-00001', duplicate: false })
})

const call = (body: string, signature: string | null, orgId = ORG) =>
  processGatewayWebhook({
    orgId,
    provider: 'RAZORPAY',
    rawBody: body,
    signature,
    headerEventId: 'evt_hdr_1'
  })

describe('processGatewayWebhook', () => {
  it('404s when the org has no gateway config', async () => {
    db.paymentGatewayConfig.findMany.mockResolvedValue([])
    const res = await call(capturedBody(), sign(capturedBody()))
    expect(res.status).toBe(404)
  })

  it('401s on missing signature', async () => {
    const res = await call(capturedBody(), null)
    expect(res.status).toBe(401)
  })

  it('401s on invalid signature and persists a SKIPPED forensic event', async () => {
    const res = await call(capturedBody(), 'deadbeef')
    expect(res.status).toBe(401)
    expect(db.webhookEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ signatureValid: false, status: 'SKIPPED' })
    }))
    expect(applyGatewayPayment).not.toHaveBeenCalled()
  })

  it('processes a valid payment.captured end to end', async () => {
    const body = capturedBody()
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ result: 'processed' })
    expect(applyGatewayPayment).toHaveBeenCalledWith(expect.objectContaining({
      providerPaymentId: 'pay_1',
      method: 'upi'
    }))
    // Health stamp + first-event webhook verification
    expect(db.paymentGatewayConfig.update).toHaveBeenCalled()
    // Event marked PROCESSED
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PROCESSED' })
    }))
  })

  it('short-circuits duplicates via Redis', async () => {
    redisMock.get.mockResolvedValue('1')
    const body = capturedBody()
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ result: 'duplicate' })
    expect(db.webhookEvent.create).not.toHaveBeenCalled()
  })

  it('short-circuits duplicates via the DB unique backstop', async () => {
    const { Prisma } = await import('@prisma/client')
    db.webhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' })
    )
    const body = capturedBody()
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ result: 'duplicate' })
    expect(applyGatewayPayment).not.toHaveBeenCalled()
  })

  it('skips (does not apply) an order belonging to a different org', async () => {
    db.gatewayOrder.findFirst.mockResolvedValue({
      id: 'gwo_2', orgId: 'org_OTHER', providerOrderId: 'order_prov_1', amount: 24000
    })
    const body = capturedBody()
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ result: 'skipped: org mismatch' })
    expect(applyGatewayPayment).not.toHaveBeenCalled()
  })

  it('500s + marks FAILED on payload/order amount mismatch (retryable)', async () => {
    const body = capturedBody({ amount: 999999 }) // ≠ order 24000 rupees
    const res = await call(body, sign(body))
    expect(res.status).toBe(500)
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED' })
    }))
    expect(applyGatewayPayment).not.toHaveBeenCalled()
  })

  it('marks payment.failed orders ATTEMPTED with failure details, invoice untouched', async () => {
    const body = JSON.stringify({
      id: 'evt_2',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_f1', order_id: 'order_prov_1', amount: 2400000,
            error_code: 'BAD_REQUEST_ERROR', error_description: 'Declined by bank'
          }
        }
      }
    })
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(db.gatewayOrder.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'ATTEMPTED',
        failureCode: 'BAD_REQUEST_ERROR',
        failureReason: 'Declined by bank'
      })
    }))
    expect(applyGatewayPayment).not.toHaveBeenCalled()
  })

  it('ignores unhandled event types as skipped', async () => {
    const body = JSON.stringify({ id: 'evt_3', event: 'settlement.processed', payload: {} })
    const res = await call(body, sign(body))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ result: expect.stringContaining('skipped') })
  })
})
