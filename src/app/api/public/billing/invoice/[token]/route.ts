import { NextResponse } from 'next/server'
import {
  buildSubscriptionInvoiceData,
  verifyInvoiceShareToken
} from '@/lib/billing/subscription-invoice-data'
import { renderSubscriptionInvoicePdf } from '@/lib/pdf/subscription-invoice-pdf'

export const dynamic = 'force-dynamic'

/**
 * Public GST-invoice PDF behind an HMAC share token (txId.sig) — this is what
 * the QR code printed ON the invoice links to, so scanning it shows the same
 * branded document rather than Razorpay's hosted page. Unguessable without
 * the signing secret; serves only SUCCESS transactions.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const txId = verifyInvoiceShareToken(token)
    if (!txId) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }
    const data = await buildSubscriptionInvoiceData(txId)
    if (!data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const buffer = await renderSubscriptionInvoicePdf(data)
    return new NextResponse(buffer as never, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${data.invoiceNo}.pdf"`,
        'Cache-Control': 'private, no-store'
      }
    })
  } catch (e) {
    console.error('Public invoice PDF error:', e)
    return NextResponse.json({ error: 'Failed to render invoice' }, { status: 500 })
  }
}
