import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { slabForStudents } from '@/lib/pricing/catalog'
import { reconcilePendingSubscriptions } from '@/lib/billing/reconcile'
import { computeProrationCredit } from '@/lib/billing/proration'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Reconcile any pending orders paid via redirect flows (no-op when none)
    try {
      await reconcilePendingSubscriptions(session.user.orgId)
    } catch (e) {
      console.error('Billing reconcile error:', e)
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

    // Fetch plans + org's student count (drives slab pricing)
    const [plans, studentCount, platform, proration] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true, isPublic: true },
        include: { planPrices: true, planModules: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.student.count({ where: { orgId: session.user.orgId, deletedAt: null } }),
      prisma.platformSettings.findUnique({ where: { id: 'default' } }),
      computeProrationCredit(session.user.orgId)
    ])

    const wallets = await prisma.messageWallet.findMany({
      where: { orgId: session.user.orgId },
      select: { channel: true, freeAllowance: true, freeUsed: true, purchasedBalance: true }
    })

    // Capacity slab the org actually paid for (latest successful subscription payment)
    const lastPaidTx = await prisma.transaction.findFirst({
      where: { orgId: session.user.orgId, type: 'SUBSCRIPTION', status: 'SUCCESS' },
      orderBy: { paidAt: 'desc' },
      select: { metadata: true }
    })
    const paidSlab = ((lastPaidTx?.metadata as any)?.slab as string | undefined) ?? null

    // Bill-to details for the checkout order summary: dedicated billing
    // address (org.settings.billingAddress) wins; main branch is the fallback.
    const storedBilling = ((org?.settings as any) || {}).billingAddress as
      | { addressLine?: string; city?: string; state?: string; pincode?: string }
      | undefined
    const mainBranch = storedBilling?.addressLine
      ? storedBilling
      : await prisma.branch.findFirst({
          where: { orgId: session.user.orgId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { addressLine: true, city: true, state: true, pincode: true }
        })

    const slab = slabForStudents(studentCount)
    const SLAB_ORDER = ['S50', 'S100', 'S200', 'S500', 'S500_PLUS']
    // Admin-negotiated org discount (capped 50%) — must match getEffectivePricing
    const orgDiscountPct = Math.min(50, Math.max(0, Number(((org?.settings as any) || {}).billingDiscountPct) || 0))
    const disc = (v: number) => Math.round(v * (1 - orgDiscountPct / 100) * 100) / 100
    const plansWithPricing = plans.map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      monthlyPrice: Number(plan.monthlyPrice),
      quarterlyPrice: plan.quarterlyPrice ? Number(plan.quarterlyPrice) : null,
      annualPrice: plan.annualPrice ? Number(plan.annualPrice) : null,
      leadCap: plan.leadCap,
      modules: plan.planModules.map((pm) => pm.moduleSlug),
      // Every slab's price — the picker lets orgs buy headroom above the
      // detected slab; smaller slabs are rejected server-side on subscribe.
      slabPrices: plan.planPrices
        .sort((a, b) => SLAB_ORDER.indexOf(a.slab) - SLAB_ORDER.indexOf(b.slab))
        .map((pp) => {
          const launchActive =
            pp.launchMonthly != null && (!pp.launchEndsAt || pp.launchEndsAt > new Date())
          const launch = launchActive ? Number(pp.launchMonthly) : null
          return {
            slab: pp.slab,
            listMonthly: Number(pp.monthlyPrice),
            launchMonthly: launch != null ? disc(launch) : null,
            effectiveMonthly: disc(launch ?? Number(pp.monthlyPrice)),
            annual: disc(launch != null ? launch * 10 : Number(pp.annualPrice)),
            bundledAiCredits: pp.bundledAiCredits,
            overagePerStudent: pp.overagePerStudent ? Number(pp.overagePerStudent) : null
          }
        })
    }))

    return NextResponse.json({
      org,
      subscription,
      transactions,
      plans: plansWithPricing,
      studentCount,
      slab,
      paidSlab,
      enabledCycles: platform?.enabledBillingCycles?.length
        ? platform.enabledBillingCycles
        : ['MONTHLY', 'ANNUAL'],
      pricesIncludeGst: !!platform?.pricesIncludeGst,
      wallets: wallets.map((w) => ({
        channel: w.channel,
        balance: w.purchasedBalance + Math.max(0, w.freeAllowance - w.freeUsed)
      })),
      proration,
      pendingPlanChange: ((org?.settings as any) || {}).pendingPlanChange ?? null,
      billingProfile: {
        name: org?.name ?? '',
        email: org?.email ?? '',
        phone: org?.phone ?? '',
        gstin: org?.gstNumber ?? null,
        address: mainBranch?.addressLine
          ? [mainBranch.addressLine, mainBranch.city, mainBranch.state, mainBranch.pincode]
              .filter(Boolean)
              .join(', ')
          : null,
        addressParts: {
          addressLine: mainBranch?.addressLine ?? '',
          city: mainBranch?.city ?? '',
          state: mainBranch?.state ?? '',
          pincode: mainBranch?.pincode ?? ''
        },
        shippingParts: (((org?.settings as any) || {}).shippingAddress as
          | { addressLine?: string; city?: string; state?: string; pincode?: string }
          | undefined) ?? null,
        poNumber: (((org?.settings as any) || {}).billingPoNumber as string | undefined) ?? null
      }
    })

  } catch (error: any) {
    console.error('Fetch billing data error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
