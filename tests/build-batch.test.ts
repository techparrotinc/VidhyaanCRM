import { describe, it, expect } from 'vitest'
import { buildBatchInvoices } from '@/app/(crm)/fee-management/create/lib/buildBatch'

const sections = [
  {
    term: { id: 'term-1' },
    dueDate: '2026-08-01',
    scheduleType: 'now' as const,
    scheduledDate: '',
    feeHeads: [
      { name: 'Tuition Fee', amount: 12000 },
      { name: 'Lab Fee', amount: 1500 }
    ]
  },
  {
    term: { id: 'term-2' },
    dueDate: '2026-11-01',
    scheduleType: 'date' as const,
    scheduledDate: '2026-10-15',
    feeHeads: [{ name: 'Tuition Fee', amount: 12000 }]
  }
]

describe('buildBatchInvoices', () => {
  it('creates one invoice per student × term with the exact batch API shape', () => {
    const result = buildBatchInvoices(sections, ['std-a', 'std-b'])
    expect(result).toHaveLength(4)

    expect(result[0]).toEqual({
      studentId: 'std-a',
      invoiceType: 'TERM',
      termId: 'term-1',
      items: [
        { name: 'Tuition Fee', quantity: 1, unitPrice: 12000 },
        { name: 'Lab Fee', quantity: 1, unitPrice: 1500 }
      ],
      dueDate: new Date('2026-08-01').toISOString(),
      scheduledDate: null,
      notes: ''
    })

    // order: all sections for a student before the next student
    expect(result.map(r => `${r.studentId}:${r.termId}`)).toEqual([
      'std-a:term-1',
      'std-a:term-2',
      'std-b:term-1',
      'std-b:term-2'
    ])
  })

  it('sets scheduledDate ISO string only for schedule-for-date sections', () => {
    const result = buildBatchInvoices(sections, ['std-a'])
    expect(result[0].scheduledDate).toBeNull()
    expect(result[1].scheduledDate).toBe(new Date('2026-10-15').toISOString())
  })

  it('empty inputs → empty payload', () => {
    expect(buildBatchInvoices([], ['std-a'])).toEqual([])
    expect(buildBatchInvoices(sections, [])).toEqual([])
  })
})
