import { describe, it, expect } from 'vitest'
import { buildBatchInvoices } from '@/app/(crm)/fee-management/create/lib/buildBatch'

const termSections = [
  {
    termId: 'term-1',
    invoiceType: 'TERM' as const,
    dueDate: '2026-08-01',
    scheduleType: 'now' as const,
    scheduledDate: '',
    feeHeads: [
      { name: 'Tuition Fee', amount: 12000 },
      { name: 'Lab Fee', amount: 1500 }
    ]
  },
  {
    termId: 'term-2',
    invoiceType: 'TERM' as const,
    dueDate: '2026-11-01',
    scheduleType: 'date' as const,
    scheduledDate: '2026-10-15',
    feeHeads: [{ name: 'Tuition Fee', amount: 12000 }]
  }
]

const adhocSection = {
  termId: null,
  invoiceType: 'ADHOC' as const,
  dueDate: '2026-07-20',
  scheduleType: 'now' as const,
  scheduledDate: '',
  feeHeads: [{ name: 'Book Set', amount: 500 }]
}

describe('buildBatchInvoices', () => {
  it('creates one invoice per student × term with the exact batch API shape', () => {
    const result = buildBatchInvoices(termSections, ['std-a', 'std-b'])
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

  it('adhoc section → invoiceType ADHOC with null termId', () => {
    const result = buildBatchInvoices([adhocSection], ['std-a', 'std-b'])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      studentId: 'std-a',
      invoiceType: 'ADHOC',
      termId: null,
      items: [{ name: 'Book Set', quantity: 1, unitPrice: 500 }],
      dueDate: new Date('2026-07-20').toISOString(),
      scheduledDate: null,
      notes: ''
    })
  })

  it('sets scheduledDate ISO string only for schedule-for-date sections', () => {
    const result = buildBatchInvoices(termSections, ['std-a'])
    expect(result[0].scheduledDate).toBeNull()
    expect(result[1].scheduledDate).toBe(new Date('2026-10-15').toISOString())
  })

  it('empty inputs → empty payload', () => {
    expect(buildBatchInvoices([], ['std-a'])).toEqual([])
    expect(buildBatchInvoices(termSections, [])).toEqual([])
  })
})
