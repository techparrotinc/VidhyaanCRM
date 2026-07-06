// Pure batch-payload builder for the create-invoice wizard. Kept free of
// React so the exact POST shape sent to /api/v1/fees/invoices (mode: batch)
// is unit-testable.

export interface BatchTermSection {
  term: { id: string }
  dueDate: string
  scheduleType: 'now' | 'date'
  scheduledDate: string
  feeHeads: { name: string; amount: number }[]
}

export interface BatchInvoiceInput {
  studentId: string
  invoiceType: 'TERM'
  termId: string
  items: { name: string; quantity: number; unitPrice: number }[]
  dueDate: string
  scheduledDate: string | null
  notes: string
}

/** One invoice per (student × term section), matching the batch API schema. */
export function buildBatchInvoices(
  sections: BatchTermSection[],
  studentIds: string[]
): BatchInvoiceInput[] {
  const invoices: BatchInvoiceInput[] = []

  for (const stdId of studentIds) {
    for (const sec of sections) {
      invoices.push({
        studentId: stdId,
        invoiceType: 'TERM',
        termId: sec.term.id,
        items: sec.feeHeads.map(h => ({
          name: h.name,
          quantity: 1,
          unitPrice: h.amount
        })),
        dueDate: new Date(sec.dueDate).toISOString(),
        scheduledDate: sec.scheduleType === 'date' ? new Date(sec.scheduledDate).toISOString() : null,
        notes: ''
      })
    }
  }

  return invoices
}
