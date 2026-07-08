import { describe, it, expect } from 'vitest'
import {
  buildExecutiveAttention,
  buildFinanceAttention,
  median
} from '@/lib/reports/insights'

const quietExec = {
  uncontacted48h: 0,
  invoicesOverdue60d: 0,
  overdue60dAmount: 0,
  gradesNearCapacity: [],
  stuckAdmissions: 0
}

describe('executive attention rules', () => {
  it('quiet inputs produce no items', () => {
    expect(buildExecutiveAttention(quietExec)).toEqual([])
  })

  it('uncontacted leads fire critical with lead-list deep link', () => {
    const items = buildExecutiveAttention({ ...quietExec, uncontacted48h: 27 })
    expect(items).toHaveLength(1)
    expect(items[0].severity).toBe('critical')
    expect(items[0].message).toContain('27 leads')
    expect(items[0].href).toContain('/lead-management')
  })

  it('overdue invoices include the amount in INR', () => {
    const items = buildExecutiveAttention({
      ...quietExec,
      invoicesOverdue60d: 14,
      overdue60dAmount: 112000
    })
    expect(items[0].message).toContain('14 invoices')
    expect(items[0].message).toContain('1,12,000')
  })

  it('capacity pressure warns below 100% and informs at/after full', () => {
    const items = buildExecutiveAttention({
      ...quietExec,
      gradesNearCapacity: [
        { grade: 'Grade 1', filled: 48, total: 50 },
        { grade: 'Grade 2', filled: 50, total: 50 }
      ]
    })
    const g1 = items.find(i => i.message.includes('Grade 1'))!
    const g2 = items.find(i => i.message.includes('Grade 2'))!
    expect(g1.severity).toBe('warning')
    expect(g1.message).toContain('96%')
    expect(g2.severity).toBe('info')
    expect(g2.message).toContain('full')
  })

  it('singular counts read grammatically', () => {
    const items = buildExecutiveAttention({ ...quietExec, stuckAdmissions: 1 })
    expect(items[0].message).toContain('1 application idle')
  })

  it('critical items sort before warnings', () => {
    const items = buildExecutiveAttention({
      ...quietExec,
      stuckAdmissions: 3,
      uncontacted48h: 5
    })
    expect(items[0].severity).toBe('critical')
    expect(items[1].severity).toBe('warning')
  })
})

describe('finance attention rules', () => {
  it('null inputs (no billing yet) stay silent', () => {
    expect(
      buildFinanceAttention({
        collectionRateMTD: null,
        ninetyPlusGrowthPct: null,
        concessionPctMTD: null
      })
    ).toEqual([])
  })

  it('low collection rate fires below 50%, not above', () => {
    const fire = buildFinanceAttention({
      collectionRateMTD: 0.4, ninetyPlusGrowthPct: null, concessionPctMTD: null
    })
    expect(fire).toHaveLength(1)
    expect(fire[0].message).toContain('40%')

    const silent = buildFinanceAttention({
      collectionRateMTD: 0.8, ninetyPlusGrowthPct: null, concessionPctMTD: null
    })
    expect(silent).toEqual([])
  })

  it('concession spike fires above 10% of billed', () => {
    const items = buildFinanceAttention({
      collectionRateMTD: 0.9, ninetyPlusGrowthPct: null, concessionPctMTD: 0.14
    })
    expect(items).toHaveLength(1)
    expect(items[0].message).toContain('14%')
  })
})

describe('median', () => {
  it('handles empty, odd and even inputs', () => {
    expect(median([])).toBeNull()
    expect(median([5])).toBe(5)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
})
