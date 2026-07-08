import { describe, it, expect } from 'vitest'
import { cadenceDueToday, renderScheduleEmail, CADENCE_TOKENS } from '@/lib/reports/schedule'

// IST-shifted dates: use UTC fields since nowInIst() pre-adds the offset.
const monday = new Date('2026-07-06T08:00:00Z') // a Monday
const wednesday = new Date('2026-07-08T08:00:00Z')
const firstOfMonth = new Date('2026-07-01T08:00:00Z')

describe('cadenceDueToday', () => {
  it('daily fires every day', () => {
    expect(cadenceDueToday('daily', wednesday)).toBe(true)
  })

  it('weekly fires only on its weekday', () => {
    expect(cadenceDueToday('weekly_mon', monday)).toBe(true)
    expect(cadenceDueToday('weekly_mon', wednesday)).toBe(false)
    expect(cadenceDueToday('weekly_wed', wednesday)).toBe(true)
  })

  it('monthly fires only on its date', () => {
    expect(cadenceDueToday('monthly_1', firstOfMonth)).toBe(true)
    expect(cadenceDueToday('monthly_1', wednesday)).toBe(false)
    expect(cadenceDueToday('monthly_15', new Date('2026-07-15T08:00:00Z'))).toBe(true)
  })

  it('unknown cadence never fires', () => {
    expect(cadenceDueToday('0 * * * *', wednesday)).toBe(false)
    expect(cadenceDueToday('', wednesday)).toBe(false)
  })

  it('every published token resolves on some day of a month', () => {
    const july = Array.from({ length: 31 }, (_, i) =>
      new Date(Date.UTC(2026, 6, i + 1, 8))
    )
    for (const token of CADENCE_TOKENS) {
      expect(july.some(d => cadenceDueToday(token, d))).toBe(true)
    }
  })
})

describe('renderScheduleEmail', () => {
  const email = renderScheduleEmail({
    orgName: 'Sunrise <School>',
    reportTitle: 'Defaulter Ageing',
    cadenceLabel: 'Weekly · Monday',
    insight: '60% of overdue money is 90+ days old',
    kpis: [
      { key: 'o', label: 'Outstanding', value: 112000, format: 'inr' },
      { key: 'r', label: 'Rate', value: 0.42, format: 'pct' }
    ],
    columns: [
      { key: 'student', label: 'Student' },
      { key: 'due', label: 'Due', format: 'inr' }
    ],
    rows: [{ student: 'A & B', due: 5000 }],
    reportUrl: 'https://www.vidhyaan.com/reports/r/defaulter-ageing'
  })

  it('formats KPIs and cells by type', () => {
    expect(email.html).toContain('₹1,12,000')
    expect(email.html).toContain('42.0%')
    expect(email.html).toContain('₹5,000')
  })

  it('escapes HTML in user-controlled strings', () => {
    expect(email.html).toContain('Sunrise &lt;School&gt;')
    expect(email.html).toContain('A &amp; B')
    expect(email.html).not.toContain('<School>')
  })

  it('carries subject, insight and deep link', () => {
    expect(email.subject).toBe('Defaulter Ageing — Sunrise <School>')
    expect(email.html).toContain('90+ days old')
    expect(email.text).toContain('/reports/r/defaulter-ageing')
  })
})
