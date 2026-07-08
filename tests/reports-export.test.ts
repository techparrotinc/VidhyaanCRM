import { describe, it, expect } from 'vitest'
import { toCsv, drainRows } from '@/lib/reports/export'
import type { Column, RowsResult } from '@/lib/reports/queries/types'

const columns: Column[] = [
  { key: 'name', label: 'Student' },
  { key: 'due', label: 'Amount Due', format: 'inr' },
  { key: 'rate', label: 'Rate', format: 'pct' },
  { key: 'date', label: 'Due Date', format: 'date' }
]

describe('toCsv', () => {
  it('serialises values by column format', () => {
    const csv = toCsv(columns, [
      { name: 'Asha', due: 1500, rate: 0.184, date: new Date('2026-07-01T00:00:00Z') }
    ])
    const [header, row] = csv.split('\n')
    expect(header).toBe('Student,Amount Due,Rate (%),Due Date')
    expect(row).toBe('Asha,1500,18.4,2026-07-01')
  })

  it('escapes commas and quotes', () => {
    const csv = toCsv(
      [{ key: 'reason', label: 'Reason' }],
      [{ reason: 'sibling, "merit" case' }]
    )
    expect(csv.split('\n')[1]).toBe('"sibling, ""merit"" case"')
  })

  it('renders null/undefined as empty cells', () => {
    const csv = toCsv(columns, [{ name: 'X', due: null, rate: undefined, date: null }])
    expect(csv.split('\n')[1]).toBe('X,,,')
  })
})

describe('drainRows', () => {
  it('follows cursors until exhausted', async () => {
    const pages: Record<string, RowsResult> = {
      start: { columns, rows: [{ name: 'a' }, { name: 'b' }], nextCursor: '2' },
      '2': { columns, rows: [{ name: 'c' }], nextCursor: null }
    }
    const result = await drainRows(async cursor => pages[cursor ?? 'start'])
    expect(result.rows.map(r => r.name)).toEqual(['a', 'b', 'c'])
    expect(result.truncated).toBe(false)
  })

  it('stops on a cursor that makes no forward progress', async () => {
    let calls = 0
    const result = await drainRows(async () => {
      calls++
      return { columns, rows: [{ name: 'x' }], nextCursor: 'same' }
    })
    expect(calls).toBeLessThanOrEqual(3)
    expect(result.rows.length).toBeGreaterThan(0)
  })
})
