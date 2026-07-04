import { describe, it, expect } from 'vitest'
import {
  sumSuccessfulPayments,
  remainingBalance,
  nextInvoiceStatus,
  sumLineItems,
  resolveScheduleStatus,
} from '@/lib/fees'

describe('sumSuccessfulPayments', () => {
  it('sums only SUCCESS payments', () => {
    const total = sumSuccessfulPayments([
      { status: 'SUCCESS', amount: 1000 },
      { status: 'FAILED', amount: 500 },
      { status: 'PENDING', amount: 250 },
      { status: 'SUCCESS', amount: '499.50' }, // Prisma Decimal arrives stringy
    ])
    expect(total).toBe(1499.5)
  })

  it('handles empty list', () => {
    expect(sumSuccessfulPayments([])).toBe(0)
  })

  it('rounds floating-point drift to paise', () => {
    const total = sumSuccessfulPayments([
      { status: 'SUCCESS', amount: 0.1 },
      { status: 'SUCCESS', amount: 0.2 },
    ])
    expect(total).toBe(0.3) // not 0.30000000000000004
  })
})

describe('remainingBalance', () => {
  it('computes total minus paid', () => {
    expect(remainingBalance(10000, 4000)).toBe(6000)
  })

  it('never goes negative on overpayment records', () => {
    expect(remainingBalance(1000, 1200)).toBe(0)
  })

  it('accepts Decimal-ish string totals', () => {
    expect(remainingBalance('2500.75', 500.25)).toBe(2000.5)
  })
})

describe('nextInvoiceStatus', () => {
  it('UNPAID when nothing paid', () => {
    expect(nextInvoiceStatus(5000, 0)).toBe('UNPAID')
  })

  it('PARTIALLY_PAID for partial payment', () => {
    expect(nextInvoiceStatus(5000, 1)).toBe('PARTIALLY_PAID')
    expect(nextInvoiceStatus(5000, 4999.99)).toBe('PARTIALLY_PAID')
  })

  it('PAID at exact total', () => {
    expect(nextInvoiceStatus(5000, 5000)).toBe('PAID')
  })

  it('PAID beyond total', () => {
    expect(nextInvoiceStatus(5000, 5001)).toBe('PAID')
  })
})

describe('payment flow invariants', () => {
  it('sequence of partial payments lands exactly on PAID', () => {
    const total = 30000
    const payments: Array<{ status: string; amount: number }> = []
    const amounts = [10000, 10000, 10000]
    let lastStatus = 'UNPAID'
    for (const amt of amounts) {
      const paidSoFar = sumSuccessfulPayments(payments)
      const remaining = remainingBalance(total, paidSoFar)
      expect(amt).toBeLessThanOrEqual(remaining) // pay-route guard
      payments.push({ status: 'SUCCESS', amount: amt })
      lastStatus = nextInvoiceStatus(total, paidSoFar + amt)
    }
    expect(lastStatus).toBe('PAID')
    expect(remainingBalance(total, sumSuccessfulPayments(payments))).toBe(0)
  })

  it('paise-decimal instalments do not strand a phantom balance', () => {
    const total = 999.99
    const payments = [
      { status: 'SUCCESS', amount: 333.33 },
      { status: 'SUCCESS', amount: 333.33 },
      { status: 'SUCCESS', amount: 333.33 },
    ]
    const paid = sumSuccessfulPayments(payments)
    expect(paid).toBe(999.99)
    expect(nextInvoiceStatus(total, paid)).toBe('PAID')
  })
})

describe('sumLineItems', () => {
  it('multiplies price by quantity per line', () => {
    expect(sumLineItems([
      { price: 1500, quantity: 2 },
      { price: 250.5, quantity: 4 },
    ])).toBe(4002)
  })

  it('empty items → 0', () => {
    expect(sumLineItems([])).toBe(0)
  })
})

describe('resolveScheduleStatus', () => {
  const now = new Date('2026-07-04T12:00:00Z')

  it('future date → SCHEDULED', () => {
    const r = resolveScheduleStatus('2026-08-01', now)
    expect(r.status).toBe('SCHEDULED')
    expect(r.scheduledDate?.toISOString().slice(0, 10)).toBe('2026-08-01')
  })

  it('past date → UNPAID but keeps the date', () => {
    const r = resolveScheduleStatus('2026-01-01', now)
    expect(r.status).toBe('UNPAID')
    expect(r.scheduledDate).not.toBeNull()
  })

  it('invalid date → UNPAID, no date', () => {
    const r = resolveScheduleStatus('not-a-date', now)
    expect(r.status).toBe('UNPAID')
    expect(r.scheduledDate).toBeNull()
  })

  it('absent → UNPAID, no date', () => {
    expect(resolveScheduleStatus(null, now)).toEqual({ status: 'UNPAID', scheduledDate: null })
    expect(resolveScheduleStatus(undefined, now)).toEqual({ status: 'UNPAID', scheduledDate: null })
  })
})
