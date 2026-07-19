import { prisma } from '@/lib/db'

/**
 * Next platform GST-invoice number, e.g. "VID2026-0042" — printed as the
 * Razorpay invoice receipt. Race-safe: a single atomic increment on the
 * PlatformSettings singleton (never count()+1, per the codes convention).
 * The sequence is continuous across years; the year prefix reflects the
 * issue date.
 */
export async function nextPlatformInvoiceNumber(): Promise<string> {
  let seq: number
  try {
    const row = await prisma.platformSettings.update({
      where: { id: 'default' },
      data: { invoiceSeq: { increment: 1 } },
      select: { invoiceSeq: true }
    })
    seq = row.invoiceSeq
  } catch {
    // Singleton row not created yet (fresh environment)
    const row = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { invoiceSeq: { increment: 1 } },
      create: { id: 'default', invoiceSeq: 1 },
      select: { invoiceSeq: true }
    })
    seq = row.invoiceSeq
  }
  return `VID${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
}
