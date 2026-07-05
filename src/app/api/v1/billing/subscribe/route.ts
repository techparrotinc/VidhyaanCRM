import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createOrder } from '@/lib/integrations/razorpay'
import { TransactionType } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse request
    const parsed = z.object({
      planSlug: z.string().min(1).max(100),
      billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
    }).safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    const { planSlug, billingCycle } = parsed.data

    // 3. Find plan
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug, isActive: true }
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    // 4. Calculate price
    const monthly = Number(plan.monthlyPrice)
    let price = monthly
    if (billingCycle === 'QUARTERLY') {
      price = plan.quarterlyPrice ? Number(plan.quarterlyPrice) : monthly * 3 * 0.9
    } else if (billingCycle === 'ANNUAL') {
      price = plan.annualPrice ? Number(plan.annualPrice) : monthly * 12 * 0.75
    }

    const amountInPaise = Math.round(price * 100)
    const timestamp = Date.now()
    const receipt = `ORD-${session.user.orgId}-${timestamp}`

    // 5. Create Razorpay Order
    const order = await createOrder(
      amountInPaise,
      'INR',
      receipt,
      {
        orgId: session.user.orgId,
        planSlug,
        billingCycle
      }
    )

    // 6. Save pending transaction to DB
    await prisma.transaction.create({
      data: {
        orgId: session.user.orgId,
        type: TransactionType.SUBSCRIPTION,
        status: 'PENDING',
        amount: price,
        currency: 'INR',
        gatewayRef: order.id
      }
    })

    // 7. Return payload for frontend checkout
    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'mock_public_key'
    })

  } catch (error: any) {
    console.error('Billing subscribe error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
