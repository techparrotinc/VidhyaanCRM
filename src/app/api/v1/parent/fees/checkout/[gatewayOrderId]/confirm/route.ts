import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireParent } from '@/lib/parent-portal'
import { confirmCheckout, CheckoutError } from '@/lib/payments/checkout'

/**
 * POST /api/v1/parent/fees/checkout/:gatewayOrderId/confirm
 * Browser-reported success from Razorpay Checkout. Signature-verified with
 * the school's key secret; settles provisionally (webhook is authoritative).
 */
export async function POST(req: NextRequest, context: { params: Promise<{ gatewayOrderId: string }> }) {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Parent role required.' }, { status: 401 })
    }
    const { gatewayOrderId } = await context.params

    const body = z.object({
      providerOrderId: z.string().min(1),
      providerPaymentId: z.string().min(1),
      signature: z.string().min(1)
    }).parse(await req.json())

    const result = await confirmCheckout({
      gatewayOrderId,
      providerOrderId: body.providerOrderId,
      providerPaymentId: body.providerPaymentId,
      signature: body.signature,
      parentId: parent.id
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid payment confirmation' }, { status: 422 })
    }
    if (error instanceof CheckoutError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('[parent/fees/confirm] error:', error)
    return NextResponse.json({ success: false, error: 'Could not confirm the payment' }, { status: 500 })
  }
}
