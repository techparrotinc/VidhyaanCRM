import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch org
    const org = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
      include: { plan: true }
    })

    // Fetch active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { orgId: session.user.orgId, deletedAt: null },
      include: { plan: true }
    })

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: true } } }
    })

    // Fetch plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      org,
      subscription,
      transactions,
      plans
    })

  } catch (error: any) {
    console.error('Fetch billing data error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
