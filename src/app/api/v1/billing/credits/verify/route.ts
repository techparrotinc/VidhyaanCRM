import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { verifyPayment } from '@/lib/integrations/razorpay'
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
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1)
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    const { orderId, paymentId, signature } = parsed.data

    const isValid = verifyPayment(orderId, paymentId, signature)
    if (!isValid) {
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
      const meta = transaction?.metadata as { channel?: string; credits?: number } | null
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
