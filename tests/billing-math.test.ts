import { describe, it, expect } from 'vitest'
import { gstBreakupPaise, applyPercentOff, prorationCreditAmount } from '@/lib/billing/money'
import { slabForStudents } from '@/lib/pricing/catalog'

const DAY = 86400000

describe('gstBreakupPaise', () => {
  it('adds 18% on top in exclusive mode', () => {
    // Enterprise S50 launch monthly: ₹1,999 → ₹2,358.82 total
    expect(gstBreakupPaise(199900, false)).toEqual({
      basePaise: 199900,
      gstPaise: 35982,
      totalPaise: 235882
    })
  })

  it('carves GST out in inclusive mode', () => {
    const { basePaise, gstPaise, totalPaise } = gstBreakupPaise(199900, true)
    expect(totalPaise).toBe(199900) // customer pays the listed price
    expect(basePaise).toBe(169407) // 199900 / 1.18
    expect(gstPaise).toBe(30493)
  })

  it('base + gst always equals total (line items must sum on the invoice)', () => {
    for (const amount of [1, 99, 11999_00, 45205_45, 119990_00]) {
      for (const inclusive of [true, false]) {
        const { basePaise, gstPaise, totalPaise } = gstBreakupPaise(amount, inclusive)
        expect(basePaise + gstPaise).toBe(totalPaise)
      }
    }
  })
})

describe('applyPercentOff', () => {
  it('applies coupon percentages', () => {
    expect(applyPercentOff(19990, 20)).toBe(15992)
    expect(applyPercentOff(2999, 10)).toBe(2699.1)
  })

  it('clamps out-of-range percentages', () => {
    expect(applyPercentOff(1000, -5)).toBe(1000)
    expect(applyPercentOff(1000, 150)).toBe(0)
  })

  it('zero percent is identity', () => {
    expect(applyPercentOff(4999, 0)).toBe(4999)
  })
})

describe('prorationCreditAmount', () => {
  const start = Date.parse('2026-07-08T00:00:00Z')

  it('credits the unused fraction of an annual subscription', () => {
    const end = start + 365 * DAY
    // Half the year left on a ₹1,19,990 annual sub
    const now = start + 182.5 * DAY
    const { credit, remainingDays, totalDays } = prorationCreditAmount(119990, start, end, now)
    expect(totalDays).toBe(365)
    expect(remainingDays).toBe(182)
    expect(credit).toBe(Math.round(((119990 * 182) / 365) * 100) / 100)
  })

  it('full credit on day zero (upgrade immediately after purchase)', () => {
    const end = start + 30 * DAY
    const { credit, remainingDays } = prorationCreditAmount(1999, start, end, start)
    expect(remainingDays).toBe(30)
    expect(credit).toBe(1999)
  })

  it('no credit once the period ends', () => {
    const end = start + 30 * DAY
    expect(prorationCreditAmount(1999, start, end, end).credit).toBe(0)
    expect(prorationCreditAmount(1999, start, end, end + DAY).credit).toBe(0)
  })

  it('no credit for free or malformed subscriptions', () => {
    const end = start + 30 * DAY
    expect(prorationCreditAmount(0, start, end, start).credit).toBe(0)
    expect(prorationCreditAmount(1999, end, start, start).credit).toBe(0) // end before start
  })

  it('no credit on the final partial day', () => {
    const end = start + 30 * DAY
    expect(prorationCreditAmount(1999, start, end, end - DAY / 2).credit).toBe(0)
  })
})

describe('slabForStudents', () => {
  it('maps counts to slabs at exact boundaries', () => {
    expect(slabForStudents(0)).toBe('S50')
    expect(slabForStudents(50)).toBe('S50')
    expect(slabForStudents(51)).toBe('S100')
    expect(slabForStudents(100)).toBe('S100')
    expect(slabForStudents(101)).toBe('S200')
    expect(slabForStudents(200)).toBe('S200')
    expect(slabForStudents(201)).toBe('S500')
    expect(slabForStudents(500)).toBe('S500')
    expect(slabForStudents(501)).toBe('S500_PLUS')
    expect(slabForStudents(5000)).toBe('S500_PLUS')
  })
})
