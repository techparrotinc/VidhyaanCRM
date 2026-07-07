import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createOrder } from '@/lib/integrations/razorpay'
import { TransactionType } from '@prisma/client'
import { getPack } from '@/lib/credits/constants'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const parsed = z.object({ packId: z.string().min(1).max(50) }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }

    const pack = getPack(parsed.data.packId)
    if (!pack) {
      return NextResponse.json({ success: false, error: 'Credit pack not found' }, { status: 404 })
    }

    const amountInPaise = Math.round(pack.priceInr * 100)
    const receipt = `CRD-${session.user.orgId}-${Date.now()}`

    const order = await createOrder(amountInPaise, 'INR', receipt, {
      orgId: session.user.orgId,
      packId: pack.id,
      channel: pack.channel,
      kind: 'CREDIT_PURCHASE'
    })

    // metadata is the server-side truth used when granting credits — the
    // verify/webhook paths never trust client input for credit amounts.
    await prisma.transaction.create({
      data: {
        orgId: session.user.orgId,
        type: TransactionType.CREDIT_PURCHASE,
        status: 'PENDING',
        amount: pack.priceInr,
        currency: 'INR',
        gatewayRef: order.id,
        metadata: { channel: pack.channel, packId: pack.id, credits: pack.credits }
      }
    })

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'mock_public_key'
    })
  } catch (error: any) {
    console.error('Credit order error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
