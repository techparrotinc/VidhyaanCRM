import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { cancelSubscription } from '@/lib/integrations/razorpay'

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ORG_ADMIN' || !user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { orgId: user.orgId, status: 'ACTIVE', deletedAt: null }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Update in database to flag cancellation at end of period
    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true
      }
    })

    // If a gateway Razorpay subscription is configured, cancel it at end of cycle
    if (subscription.gatewaySubId) {
      await cancelSubscription(subscription.gatewaySubId, true).catch(err => {
        console.error('Failed to cancel subscription in Razorpay:', err)
      })
    }

    return NextResponse.json({
      success: true,
      cancelAtDate: updatedSub.currentPeriodEnd
    })

  } catch (error: any) {
    console.error('Cancel subscription API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
