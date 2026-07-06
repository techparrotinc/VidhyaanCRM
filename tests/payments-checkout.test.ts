import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import crypto from 'crypto'

// In-memory prisma stub — only the delegates checkout.ts touches.
// vi.hoisted because vi.mock factories are hoisted above const declarations.
const db = vi.hoisted(() => ({
  invoice: { findFirst: vi.fn() },
  paymentGatewayConfig: { findFirst: vi.fn() },
  gatewayOrder: { create: vi.fn() },
  payment: { findFirst: vi.fn() }
}))
vi.mock('@/lib/db', () => ({ prisma: db }))

import { createCheckout, CheckoutError, isPayable } from '@/lib/payments/checkout'
import { encryptSecret } from '@/lib/payments/vault'

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY ??= crypto.randomBytes(32).toString('base64')
  process.env.PAYMENT_PROVIDER_MOCK = '1' // registry serves MockProvider (never in production)
})

const ORG = 'org_1'

function invoiceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv_1',
    orgId: ORG,
    studentId: 'stu_1',
    invoiceNumber: 'INV-2026-00001',
    status: 'UNPAID',
    totalAmount: 24000,
    payments: [],
    branchId: null,
    academicYearId: null,
    ...overrides
  }
}

function configRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cfg_1',
    orgId: ORG,
    provider: 'RAZORPAY',
    environment: 'TEST',
    status: 'ACTIVE',
    isCurrent: true,
    deletedAt: null,
    allowPartial: true,
    minPartialAmount: 500,
    keyIdEncrypted: encryptSecret('rzp_test_key'),
    keySecretEncrypted: encryptSecret('secret'),
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  db.gatewayOrder.create.mockImplementation(async ({ data }: any) => data)
})

describe('isPayable', () => {
  it('accepts UNPAID / PARTIALLY_PAID / OVERDUE only', () => {
    expect(isPayable('UNPAID' as never)).toBe(true)
    expect(isPayable('PARTIALLY_PAID' as never)).toBe(true)
    expect(isPayable('OVERDUE' as never)).toBe(true)
    for (const status of ['PAID', 'WAIVED', 'SCHEDULED', 'REFUNDED']) {
      expect(isPayable(status as never)).toBe(false)
    }
  })
})

describe('createCheckout validation', () => {
  it('rejects a missing invoice with 404', async () => {
    db.invoice.findFirst.mockResolvedValue(null)
    await expect(createCheckout({ invoiceId: 'nope', orgId: ORG, amount: 100 }))
      .rejects.toMatchObject({ status: 404 })
  })

  it('rejects non-payable invoice states', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow({ status: 'PAID' }))
    await expect(createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 100 }))
      .rejects.toThrow('not payable')
  })

  it('rejects amounts above the live balance', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow({
      payments: [{ status: 'SUCCESS', amount: 10000 }]
    }))
    await expect(createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 20000 }))
      .rejects.toThrow('exceeds the remaining balance of ₹14000')
  })

  it('rejects when no gateway is active for the org (403)', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow())
    db.paymentGatewayConfig.findFirst.mockResolvedValue(null)
    await expect(createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 24000 }))
      .rejects.toMatchObject({ status: 403 })
  })

  it('rejects partial payment when the school disallows it', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow())
    db.paymentGatewayConfig.findFirst.mockResolvedValue(configRow({ allowPartial: false }))
    await expect(createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 1000 }))
      .rejects.toThrow('does not accept partial')
  })

  it('rejects partial payment below the configured minimum', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow())
    db.paymentGatewayConfig.findFirst.mockResolvedValue(configRow())
    await expect(createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 100 }))
      .rejects.toThrow('Minimum partial payment is ₹500')
  })

  it('creates order for a valid full payment', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow())
    db.paymentGatewayConfig.findFirst.mockResolvedValue(configRow())

    const result = await createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 24000, parentId: 'par_1' })

    expect(result.amountMinor).toBe(2400000)
    expect(result.keyId).toBe('rzp_test_key')
    expect(result.providerOrderId).toMatch(/^order_mock_/)

    const row = db.gatewayOrder.create.mock.calls[0][0].data
    expect(row.orgId).toBe(ORG)
    expect(row.invoiceId).toBe('inv_1')
    expect(row.parentId).toBe('par_1')
    expect(Number(row.amount)).toBe(24000)
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('creates order for a valid partial payment at the minimum', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow())
    db.paymentGatewayConfig.findFirst.mockResolvedValue(configRow())
    const result = await createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 500 })
    expect(result.amountMinor).toBe(50000)
  })

  it('CheckoutError carries a parent-friendly message, not internals', async () => {
    db.invoice.findFirst.mockResolvedValue(invoiceRow({ status: 'WAIVED' }))
    try {
      await createCheckout({ invoiceId: 'inv_1', orgId: ORG, amount: 100 })
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(CheckoutError)
      expect((e as Error).message).not.toMatch(/prisma|sql|undefined/i)
    }
  })
})
