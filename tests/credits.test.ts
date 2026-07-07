import { describe, it, expect } from 'vitest'
import {
  computeSpendSplit,
  needsMonthlyReset,
  startOfUtcMonth
} from '@/lib/credits/pure'
import { CREDIT_PACKS, getPack, packsForChannel } from '@/lib/credits/constants'

describe('computeSpendSplit', () => {
  it('free-first, no purchased touched when free covers it', () => {
    expect(computeSpendSplit(25, 100, 10)).toEqual({
      ok: true, fromFree: 10, fromPurchased: 0, shortfall: 0
    })
  })

  it('exact free boundary', () => {
    expect(computeSpendSplit(25, 0, 25)).toEqual({
      ok: true, fromFree: 25, fromPurchased: 0, shortfall: 0
    })
  })

  it('spills into purchased', () => {
    expect(computeSpendSplit(5, 100, 30)).toEqual({
      ok: true, fromFree: 5, fromPurchased: 25, shortfall: 0
    })
  })

  it('insufficient — reports shortfall, not ok', () => {
    expect(computeSpendSplit(5, 10, 30)).toEqual({
      ok: false, fromFree: 5, fromPurchased: 10, shortfall: 15
    })
  })

  it('zero balance blocks entirely', () => {
    expect(computeSpendSplit(0, 0, 1)).toEqual({
      ok: false, fromFree: 0, fromPurchased: 0, shortfall: 1
    })
  })

  it('negative free remaining treated as zero', () => {
    expect(computeSpendSplit(-3, 10, 5)).toEqual({
      ok: true, fromFree: 0, fromPurchased: 5, shortfall: 0
    })
  })

  it('qty 0 is a no-op', () => {
    expect(computeSpendSplit(0, 0, 0).ok).toBe(true)
  })
})

describe('needsMonthlyReset', () => {
  it('same UTC month → no reset', () => {
    expect(needsMonthlyReset(new Date('2026-07-01T00:00:00Z'), new Date('2026-07-31T23:59:59Z'))).toBe(false)
  })

  it('month rollover → reset', () => {
    expect(needsMonthlyReset(new Date('2026-06-15T00:00:00Z'), new Date('2026-07-01T00:00:01Z'))).toBe(true)
  })

  it('year rollover, same month number → reset', () => {
    expect(needsMonthlyReset(new Date('2025-07-10T00:00:00Z'), new Date('2026-07-10T00:00:00Z'))).toBe(true)
  })

  it('december → january', () => {
    expect(needsMonthlyReset(new Date('2025-12-31T23:59:59Z'), new Date('2026-01-01T00:00:00Z'))).toBe(true)
  })
})

describe('startOfUtcMonth', () => {
  it('truncates to first of month UTC', () => {
    expect(startOfUtcMonth(new Date('2026-07-19T18:45:00Z')).toISOString()).toBe('2026-07-01T00:00:00.000Z')
  })
})

describe('credit packs catalog', () => {
  it('every pack has positive credits and price', () => {
    for (const p of CREDIT_PACKS) {
      expect(p.credits).toBeGreaterThan(0)
      expect(p.priceInr).toBeGreaterThan(0)
    }
  })

  it('pack ids unique and resolvable', () => {
    const ids = CREDIT_PACKS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(getPack('sms_100')?.credits).toBe(100)
    expect(getPack('nope')).toBeUndefined()
  })

  it('both channels have packs', () => {
    expect(packsForChannel('SMS').length).toBeGreaterThan(0)
    expect(packsForChannel('WHATSAPP').length).toBeGreaterThan(0)
  })
})
