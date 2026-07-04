// Pure fee-math helpers shared by the fee routes. Amounts arrive as
// Prisma Decimal | number | string, so everything is normalised through
// Number() and rounded to paise to avoid floating-point drift.

export type InvoicePaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID'

const round2 = (n: number) => Math.round(n * 100) / 100

/** Sum of SUCCESS payments against an invoice. */
export function sumSuccessfulPayments(
  payments: Array<{ status: string; amount: unknown }>
): number {
  return round2(
    payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  )
}

/** Unpaid balance; never negative. */
export function remainingBalance(totalAmount: unknown, totalPaid: number): number {
  return round2(Math.max(0, Number(totalAmount) - totalPaid))
}

/** Invoice status after a payment lands. */
export function nextInvoiceStatus(
  totalAmount: unknown,
  totalPaid: number
): InvoicePaymentStatus {
  if (totalPaid >= Number(totalAmount)) return 'PAID'
  if (totalPaid > 0) return 'PARTIALLY_PAID'
  return 'UNPAID'
}

/** Invoice total from line items (price × quantity per line). */
export function sumLineItems(
  items: Array<{ price: number; quantity: number }>
): number {
  return round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
}

/**
 * Initial status for a new invoice: SCHEDULED only when a valid
 * scheduled date lies in the future, otherwise UNPAID.
 */
export function resolveScheduleStatus(
  scheduledDate: string | null | undefined,
  now: Date = new Date()
): { status: 'SCHEDULED' | 'UNPAID'; scheduledDate: Date | null } {
  if (scheduledDate) {
    const parsed = new Date(scheduledDate)
    if (!isNaN(parsed.getTime())) {
      return {
        status: parsed > now ? 'SCHEDULED' : 'UNPAID',
        scheduledDate: parsed
      }
    }
  }
  return { status: 'UNPAID', scheduledDate: null }
}
