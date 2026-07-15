import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParentFromRequest, linkedStudentsWhere } from '@/lib/parent-portal'
import { windowLimiter } from '@/lib/ratelimit'
import { createCheckout, CheckoutError } from '@/lib/payments/checkout'

/**
 * POST /api/v1/parent/fees/invoices/:id/checkout
 * Creates a gateway order for the given amount. Amount and ownership are
 * validated server-side; the returned order is what Razorpay Checkout opens.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const parent = await requireParentFromRequest(req)
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Parent role required.' }, { status: 401 })
    }
    const { id: invoiceId } = await context.params

    const rate = await windowLimiter(`checkout:${parent.id}:${invoiceId}`, 5, 60)
    if (!rate.success) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Wait a minute and try again.' }, { status: 429 })
    }

    const body = z.object({ amount: z.number().positive() }).parse(await req.json())

    // Ownership: invoice's student must be linked to this parent
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null, student: linkedStudentsWhere(parent) },
      select: { id: true, orgId: true }
    })
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const checkout = await createCheckout({
      invoiceId: invoice.id,
      orgId: invoice.orgId,
      amount: body.amount,
      parentId: parent.id
    })

    return NextResponse.json({
      success: true,
      data: {
        ...checkout,
        prefill: { name: parent.name ?? undefined, email: parent.email ?? undefined, contact: parent.phone }
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 422 })
    }
    if (error instanceof CheckoutError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('[parent/fees/checkout] error:', error)
    return NextResponse.json({ success: false, error: 'Could not start the payment. Try again.' }, { status: 500 })
  }
}
