import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.plan.findMany({
      where: { deletedAt: null },
      include: {
        planModules: true,
        organizations: {
          where: { deletedAt: null },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE', deletedAt: null }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    const formattedPlans = plans.map((plan) => {
      const subscriberCount = plan.organizations.length
      
      // MRR contribution — normalize each active subscription to a monthly
      // amount (matches /api/admin/stats): quarterly ÷ 3, annual ÷ 12.
      // Summing raw amounts overstated plans with non-monthly cycles up to 12×.
      const revenue = plan.organizations.reduce((sum, org) => {
        const activeSubSum = org.subscriptions.reduce((subSum, sub) => {
          const amount = Number(sub.amount)
          if (sub.billingCycle === 'QUARTERLY') return subSum + amount / 3
          if (sub.billingCycle === 'ANNUAL') return subSum + amount / 12
          return subSum + amount // MONTHLY
        }, 0)
        return sum + activeSubSum
      }, 0)

      return {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        monthlyPrice: Number(plan.monthlyPrice),
        quarterlyPrice: plan.quarterlyPrice ? Number(plan.quarterlyPrice) : null,
        annualPrice: plan.annualPrice ? Number(plan.annualPrice) : null,
        leadCap: plan.leadCap,
        isPublic: plan.isPublic,
        isActive: plan.isActive,
        modules: plan.planModules.map((pm) => pm.moduleSlug),
        subscriberCount,
        revenue
      }
    })

    return NextResponse.json(formattedPlans)

  } catch (error: any) {
    console.error('List Plans API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
