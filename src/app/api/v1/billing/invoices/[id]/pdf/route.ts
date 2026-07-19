import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { buildSubscriptionInvoiceData } from '@/lib/billing/subscription-invoice-data'
import { renderSubscriptionInvoicePdf } from '@/lib/pdf/subscription-invoice-pdf'

/**
 * Branded GST invoice PDF for a platform subscription / credit-pack payment.
 * Data assembly (our records + Razorpay settlement fetch) lives in
 * buildSubscriptionInvoiceData — shared with the public QR route and the
 * payment-confirmation email attachment.
 */
export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user, params }) => {
    const data = await buildSubscriptionInvoiceData(params?.id as string, user.orgId)
    if (!data) throw Errors.notFound('Invoice')

    const buffer = await renderSubscriptionInvoicePdf(data)
    return new NextResponse(buffer as never, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.invoiceNo}.pdf"`
      }
    })
  }
})
