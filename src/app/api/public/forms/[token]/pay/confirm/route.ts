import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { getActiveGatewayConfig } from '@/lib/payments/checkout'
import { decryptCredentials } from '@/lib/payments/config'
import { getProvider } from '@/lib/payments/registry'
import { finalizeFeePaidSubmission } from '@/lib/forms/finalize'

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

// Browser-reported settlement. Signature is verified server-side with the
// org's own key secret before the submission is finalized. Idempotent.
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const instance = await prisma.formInstance.findUnique({ where: { token } })
  if (!instance) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  const body = bodySchema.parse(await req.json())

  // Order id must match the one we minted for this instance.
  if (!instance.gatewayRef || instance.gatewayRef !== body.razorpay_order_id) {
    return NextResponse.json({ error: 'Payment reference mismatch' }, { status: 400 })
  }

  if (instance.paymentStatus === 'PAID') {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  const config = await getActiveGatewayConfig(instance.orgId)
  if (!config) return NextResponse.json({ error: 'Gateway not configured' }, { status: 403 })
  const creds = decryptCredentials(config)
  const provider = getProvider(config.provider)

  const valid = provider.verifyCheckoutSignature(
    { providerOrderId: body.razorpay_order_id, providerPaymentId: body.razorpay_payment_id, signature: body.razorpay_signature },
    creds,
  )
  if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

  await finalizeFeePaidSubmission(instance.id)

  const form = await prisma.form.findUnique({ where: { id: instance.formId }, select: { settings: true } })
  return NextResponse.json({ ok: true, successMessage: (form?.settings as any)?.successMessage ?? null })
}
