import { NextRequest, NextResponse } from 'next/server'
import { processGatewayWebhook } from '@/lib/payments/webhook-processor'

/**
 * POST /api/webhooks/payments/razorpay/:orgId
 * Per-org fee-payment webhook intake. Public endpoint — authentication is the
 * HMAC signature over the raw body, verified against the org's own webhook
 * secret. Raw body is read before any parsing; a re-serialized body would
 * change bytes and fail verification.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await context.params
    const rawBody = await req.text()

    const outcome = await processGatewayWebhook({
      orgId,
      provider: 'RAZORPAY',
      rawBody,
      signature: req.headers.get('x-razorpay-signature'),
      headerEventId: req.headers.get('x-razorpay-event-id')
    })

    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (error) {
    console.error('[webhooks/payments/razorpay] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
