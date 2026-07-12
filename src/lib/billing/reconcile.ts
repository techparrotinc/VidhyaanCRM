import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { fetchOrderPayments } from '@/lib/integrations/razorpay'
import { recordCouponRedemption } from '@/lib/billing/coupons'
import { syncBundledAiAllowance, remapOrgModulesToPlan } from '@/lib/billing/lifecycle'
import { SubscriptionStatus, type BillingCycle } from '@prisma/client'

/**
 * Reconciles PENDING subscription transactions against Razorpay.
 *
 * Invoice-backed Checkout can redirect the browser after payment instead of
 * invoking the JS handler, so /billing/verify never runs. On billing-page
 * load we ask Razorpay whether each recent pending order was actually paid
 * (authenticated server-to-server; amount must match) and, if so, run the
 * same activation the verify route performs.
 *
 * Returns the number of transactions reconciled.
 */
/**
 * Applies a scheduled (downgrade) plan change once its effective date passes.
 * Stored in org.settings.pendingPlanChange by the subscribe route when the
 * proration credit covers the new plan entirely (net charge ≤ 0).
 */
export async function applyPendingPlanChange(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId, deletedAt: null },
    select: { settings: true }
  })
  const settings = (org?.settings as any) || {}
  const pending = settings.pendingPlanChange as
    | { planSlug: string; billingCycle: BillingCycle; slab?: string; effectiveAt: string }
    | undefined
  if (!pending || new Date(pending.effectiveAt).getTime() > Date.now()) return false

  const plan = await prisma.plan.findUnique({
    where: { slug: pending.planSlug },
    include: { planModules: true, planPrices: true }
  })
  if (!plan) return false

  const slabPrice = pending.slab ? plan.planPrices.find((pp) => pp.slab === pending.slab) : null
  const monthly = slabPrice
    ? Number(slabPrice.launchMonthly ?? slabPrice.monthlyPrice)
    : Number(plan.monthlyPrice)
  const amount =
    pending.billingCycle === 'ANNUAL'
      ? slabPrice
        ? Number(slabPrice.launchMonthly ? Number(slabPrice.launchMonthly) * 10 : slabPrice.annualPrice)
        : monthly * 10
      : pending.billingCycle === 'QUARTERLY'
        ? monthly * 3
        : monthly

  const periodStart = new Date()
  const periodEnd = new Date()
  if (pending.billingCycle === 'MONTHLY') periodEnd.setMonth(periodEnd.getMonth() + 1)
  else if (pending.billingCycle === 'QUARTERLY') periodEnd.setMonth(periodEnd.getMonth() + 3)
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  const existing = await prisma.subscription.findFirst({ where: { orgId } })
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        billingCycle: pending.billingCycle,
        amount,
        startedAt: periodStart,
        currentPeriodEnd: periodEnd
      }
    })
  }

  // Module set follows the new (smaller) plan: enable its modules, disable the rest
  await remapOrgModulesToPlan(orgId, plan.id)

  const { pendingPlanChange: _dropped, ...restSettings } = settings
  await prisma.organization.update({
    where: { id: orgId },
    data: { planId: plan.id, settings: restSettings }
  })
  await syncBundledAiAllowance(orgId, plan.id, pending.slab ?? null).catch((e) =>
    console.error('AI allowance sync failed:', e)
  )

  try {
    await redis.del(`org:${orgId}`)
  } catch (e) {
    console.error('pending plan change cache bust failed:', e)
  }

  await prisma.auditLog
    .create({
      data: {
        orgId,
        action: 'UPDATE',
        entityType: 'SUBSCRIPTION',
        entityId: existing?.id ?? orgId,
        after: { planId: plan.id, billingCycle: pending.billingCycle, amount, scheduledChangeApplied: true }
      }
    })
    .catch((e) => console.error('pending plan change audit failed:', e))

  return true
}

export async function reconcilePendingSubscriptions(orgId: string): Promise<number> {
  // Scheduled downgrades apply first so the rest of the page reads fresh state
  await applyPendingPlanChange(orgId).catch((e) => console.error('applyPendingPlanChange error:', e))

  // 10-day window: renewal payment links are issued at T−7 and may be paid
  // any time up to (and past) the period end.
  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  // FAILED rows are included: a failed first attempt followed by a successful
  // retry inside the same Checkout pays against the SAME order — the captured
  // payment check below recovers those too.
  const pending = await prisma.transaction.findMany({
    where: {
      orgId,
      type: 'SUBSCRIPTION',
      status: { in: ['PENDING', 'FAILED'] },
      createdAt: { gte: cutoff },
      gatewayRef: { startsWith: 'order_' }
    },
    orderBy: { createdAt: 'asc' }
  })
  // Abandoned orders (never paid, older than the reconcile window) → FAILED,
  // so the billing history doesn't accumulate zombie PENDING rows.
  await prisma.transaction.updateMany({
    where: {
      orgId,
      type: 'SUBSCRIPTION',
      status: 'PENDING',
      createdAt: { lt: cutoff },
      gatewayRef: { startsWith: 'order_' }
    },
    data: { status: 'FAILED' }
  })

  if (pending.length === 0) return 0

  let reconciled = 0
  for (const tx of pending) {
    const meta = (tx.metadata as any) || {}
    const planSlug = meta.planSlug as string | undefined
    const billingCycle = (meta.billingCycle as BillingCycle | undefined) ?? 'MONTHLY'
    if (!planSlug || !tx.gatewayRef) continue

    const payments = await fetchOrderPayments(tx.gatewayRef)
    const expectedPaise = Math.round(Number(tx.amount) * 100)
    const paid = payments.find(
      (p) => ['captured', 'authorized'].includes(p.status) && p.amount === expectedPaise
    )
    if (!paid) continue

    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
      include: { planModules: true }
    })
    if (!plan) continue

    // Renewals paid early extend FROM the current period end — no days lost
    const existingSub = await prisma.subscription.findFirst({ where: { orgId } })
    const isEarlyRenewal =
      meta.renewal === true &&
      existingSub?.currentPeriodEnd &&
      existingSub.currentPeriodEnd > new Date() &&
      existingSub.planId // same-plan extension
    const currentPeriodStart = isEarlyRenewal ? new Date(existingSub!.currentPeriodEnd!) : new Date()
    const currentPeriodEnd = new Date(currentPeriodStart)
    if (billingCycle === 'MONTHLY') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    else if (billingCycle === 'QUARTERLY') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3)
    else currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)

    // Subscription amount = full cycle price (renewals bill the full price even
    // when this first charge was prorated); fall back to the charged base.
    const baseAmount =
      typeof meta.fullCyclePrice === 'number'
        ? meta.fullCyclePrice
        : typeof meta.baseAmount === 'number'
          ? meta.baseAmount
          : Number(tx.amount)

    const subData = {
      orgId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle,
      amount: baseAmount,
      startedAt: currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: null,
      // A fresh payment supersedes any pending cancellation or grace state
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
      gatewaySubId: null
    }
    const existing = await prisma.subscription.findFirst({ where: { orgId } })
    const subscription = existing
      ? await prisma.subscription.update({ where: { id: existing.id }, data: subData })
      : await prisma.subscription.create({ data: subData })

    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'SUCCESS',
        gatewayRef: paid.id,
        paidAt: new Date(),
        subscriptionId: subscription.id,
        invoiceUrl: (meta.invoiceUrl as string | undefined) ?? undefined
      }
    })
    if (meta.couponId) {
      await recordCouponRedemption(meta.couponId as string, orgId, tx.id)
    }
    await syncBundledAiAllowance(orgId, plan.id, meta.slab ?? null).catch((e) =>
      console.error('AI allowance sync failed:', e)
    )

    // Remap modules to exactly the paid plan's set (revokes trial extras too)
    await remapOrgModulesToPlan(orgId, plan.id)
    // Paid plan change supersedes any previously scheduled downgrade
    const orgRow = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } })
    const { pendingPlanChange: _superseded, ...cleanSettings } = ((orgRow?.settings as any) || {})
    await prisma.organization.update({
      where: { id: orgId },
      data: { planId: plan.id, trialEndsAt: null, status: 'ACTIVE', settings: cleanSettings }
    })

    await prisma.auditLog
      .create({
        data: {
          orgId,
          action: 'UPDATE',
          entityType: 'SUBSCRIPTION',
          entityId: subscription.id,
          after: {
            planId: plan.id,
            billingCycle,
            amount: baseAmount,
            status: 'ACTIVE',
            reconciledFrom: 'PENDING_ORDER',
            paymentId: paid.id
          }
        }
      })
      .catch((e) => console.error('reconcile audit log failed:', e))

    try {
      await redis.del(`org:${orgId}`)
    } catch (e) {
      console.error('reconcile cache bust failed:', e)
    }

    reconciled++
  }
  return reconciled
}
