import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { getActiveGatewayConfig } from '@/lib/payments/checkout'
import { decryptCredentials } from '@/lib/payments/config'
import { getProvider } from '@/lib/payments/registry'
import { toMinor } from '@/lib/payments/money'

// Creates a gateway order for a form's application fee, on the ORG's own
// Razorpay account. providerOrderId is stored in FormInstance.gatewayRef —
// which is never overwritten once a payment succeeds (billing invariant).
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const instance = await prisma.formInstance.findUnique({ where: { token } })
  if (!instance) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  if (instance.expiresAt && instance.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Form link expired' }, { status: 410 })
  }
  if (instance.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  }

  const form = await prisma.form.findUnique({ where: { id: instance.formId } })
  if (!form || !form.feeRequired || form.applicationFeeAmount == null || Number(form.applicationFeeAmount) <= 0) {
    return NextResponse.json({ error: 'No application fee on this form' }, { status: 400 })
  }

  // A submission must already exist (fill → submit → pay).
  const submission = await prisma.formSubmission.findFirst({
    where: { instanceId: instance.id, paymentStatus: 'PENDING' },
  })
  if (!submission) return NextResponse.json({ error: 'Submit the form before paying' }, { status: 409 })

  const config = await getActiveGatewayConfig(instance.orgId)
  if (!config) return NextResponse.json({ error: 'Online payments are not enabled for this institution' }, { status: 403 })

  const amount = Number(form.applicationFeeAmount)
  const amountMinor = toMinor(amount)
  const provider = getProvider(config.provider)
  const creds = decryptCredentials(config)

  const order = await provider.createOrder(
    { amountMinor, currency: form.feeCurrency || 'INR', receipt: instance.id, notes: { orgId: instance.orgId, formInstanceId: instance.id, kind: 'application_fee' } },
    creds,
  )

  await prisma.formInstance.update({
    where: { id: instance.id },
    data: { gatewayRef: order.providerOrderId, paymentStatus: 'PENDING' },
  })

  const org = await prisma.organization.findUnique({ where: { id: instance.orgId }, select: { name: true } })

  return NextResponse.json({
    keyId: creds.keyId, // public identifier — safe for browser
    providerOrderId: order.providerOrderId,
    amountMinor,
    currency: form.feeCurrency || 'INR',
    name: org?.name ?? 'Application Fee',
    description: form.name,
  })
}
