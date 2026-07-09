import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { verifyPayment, fetchPayment } from '@/lib/integrations/razorpay'
import { TransactionStatus, TransactionType, type MessageChannel } from '@prisma/client'
import { grantPurchasedCredits, getWalletSummary } from '@/lib/credits/engine'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    const orgId = session.user.orgId

    const parsed = z.object({
      orderId: z.string().min(1).optional(),
      paymentId: z.string().min(1),
      signature: z.string().min(1).optional()
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    const { paymentId, signature } = parsed.data
    let { orderId } = parsed.data

    // Signature when present; else authenticated API fetch (invoice-backed
    // Checkout callbacks may omit the order signature)
    let isValid = orderId && signature ? await verifyPayment(orderId, paymentId, signature) : false
    if (!isValid) {
      const payment = await fetchPayment(paymentId)
      if (payment && ['captured', 'authorized'].includes(payment.status)) {
        if (payment.order_id) orderId = payment.order_id
        isValid = !!orderId || paymentId.startsWith('pay_mock_')
      }
    }
    if (!isValid || (!orderId && !paymentId.startsWith('pay_mock_'))) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
    }

    // Idempotent claim: only one of verify/webhook flips PENDING → SUCCESS
    const claimed = await prisma.transaction.updateMany({
      where: {
        orgId,
        gatewayRef: orderId,
        type: TransactionType.CREDIT_PURCHASE,
        status: TransactionStatus.PENDING
      },
      data: {
        status: TransactionStatus.SUCCESS,
        gatewayRef: paymentId,
        paidAt: new Date()
      }
    })

    if (claimed.count > 0) {
      const transaction = await prisma.transaction.findFirst({
        where: { orgId, gatewayRef: paymentId, type: TransactionType.CREDIT_PURCHASE }
      })
      const meta = transaction?.metadata as { channel?: string; credits?: number; invoiceUrl?: string } | null
      if (transaction && meta?.invoiceUrl) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { invoiceUrl: meta.invoiceUrl }
        }).catch(() => {})
      }
      if (transaction && meta?.channel && meta?.credits) {
        await grantPurchasedCredits(
          orgId,
          meta.channel as MessageChannel,
          meta.credits,
          transaction.id
        )
      } else {
        console.error('Credit verify: transaction metadata missing', transaction?.id)
      }
    }
    // claimed.count === 0 → webhook already processed it; still return success

    const wallets = await getWalletSummary(orgId)
    return NextResponse.json({ success: true, data: { wallets } })
  } catch (error: any) {
    console.error('Credit verify error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
