import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { toMinor, fromMinor, InvalidAmountError } from '@/lib/payments/money'

describe('toMinor (rupees → paise)', () => {
  it('converts whole rupees', () => {
    expect(toMinor(24000)).toBe(2400000)
  })

  it('converts paise-precise decimals', () => {
    expect(toMinor('499.50')).toBe(49950)
    expect(toMinor(new Prisma.Decimal('0.01'))).toBe(1)
  })

  it('rejects sub-paise amounts', () => {
    expect(() => toMinor('0.005')).toThrow(InvalidAmountError)
    expect(() => toMinor(10.001)).toThrow(InvalidAmountError)
  })

  it('rejects zero and negative amounts', () => {
    expect(() => toMinor(0)).toThrow(InvalidAmountError)
    expect(() => toMinor(-100)).toThrow(InvalidAmountError)
  })

  it('rejects non-finite input', () => {
    expect(() => toMinor(Infinity)).toThrow(InvalidAmountError)
    expect(() => toMinor(NaN)).toThrow(InvalidAmountError)
  })
})

describe('fromMinor (paise → rupees)', () => {
  it('converts back to Decimal rupees', () => {
    expect(fromMinor(2400000).toString()).toBe('24000')
    expect(fromMinor(49950).toString()).toBe('499.5')
    expect(fromMinor(0).toString()).toBe('0')
  })

  it('rejects fractional or negative paise', () => {
    expect(() => fromMinor(10.5)).toThrow(InvalidAmountError)
    expect(() => fromMinor(-1)).toThrow(InvalidAmountError)
  })

  it('roundtrips', () => {
    expect(fromMinor(toMinor('123.45')).toString()).toBe('123.45')
  })
})
