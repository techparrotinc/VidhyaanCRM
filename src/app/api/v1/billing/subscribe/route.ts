import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createGstInvoice } from '@/lib/integrations/razorpay'
import { getEffectivePricing, priceForCycle } from '@/lib/pricing/effective'
import { computeProrationCredit } from '@/lib/billing/proration'
import { validateCoupon } from '@/lib/billing/coupons'
import { applyPercentOff } from '@/lib/billing/money'
import { TransactionType } from '@prisma/client'
import { getRazorpayCredentials } from '@/lib/platform-config'

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
      billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
      slab: z.enum(['S50', 'S100', 'S200', 'S500', 'S500_PLUS']).optional(),
      gstin: z.string().trim().toUpperCase()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][A-Z][0-9A-Z]$/, 'Invalid GSTIN')
        .optional()
        .or(z.literal('').transform(() => undefined)),
      couponCode: z.string().trim().max(40).optional()
    }).safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    const { planSlug, billingCycle, slab, gstin, couponCode } = parsed.data

    // 3. Find plan
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug, isActive: true }
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    // 3.5 Billing cycle must be platform-enabled
    const platform = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
    const enabledCycles = platform?.enabledBillingCycles?.length
      ? platform.enabledBillingCycles
      : ['MONTHLY', 'ANNUAL']
    if (!enabledCycles.includes(billingCycle)) {
      return NextResponse.json({ success: false, error: 'This billing cycle is not available' }, { status: 400 })
    }

    // 4. Calculate price — slab-aware; requested slab may only be ≥ the slab
    // detected from the org's student count (buying headroom is allowed,
    // underbuying is silently corrected to the detected slab)
    const pricing = await getEffectivePricing(plan.id, session.user.orgId, slab)
    const undiscountedCycle = priceForCycle(pricing, billingCycle)
    let fullPrice = undiscountedCycle

    // Coupon: server-side re-validation; percent off the cycle price
    let coupon: { couponId: string; code: string; percentOff: number } | null = null
    if (couponCode) {
      const check = await validateCoupon(couponCode, session.user.orgId)
      if (!check.valid) {
        return NextResponse.json({ success: false, error: check.reason || 'Invalid coupon' }, { status: 400 })
      }
      coupon = { couponId: check.couponId!, code: check.code!, percentOff: check.percentOff! }
      fullPrice = applyPercentOff(fullPrice, coupon.percentOff)
    }

    // 4.5 Proration: credit the unused portion of the current subscription.
    // Net > 0 → immediate prorated charge. Net ≤ 0 (downgrade) → no charge now;
    // the plan change is scheduled for the current period end.
    const proration = await computeProrationCredit(session.user.orgId)
    const creditApplied = proration ? Math.min(proration.credit, fullPrice) : 0
    const price = Math.round((fullPrice - creditApplied) * 100) / 100

    if (price <= 0) {
      const currentOrg = await prisma.organization.findUniqueOrThrow({
        where: { id: session.user.orgId },
        select: { settings: true }
      })
      const settings = (currentOrg.settings as any) || {}
      await prisma.organization.update({
        where: { id: session.user.orgId },
        data: {
          settings: {
            ...settings,
            pendingPlanChange: {
              planSlug,
              billingCycle,
              slab: pricing.slab,
              effectiveAt: proration!.currentPeriodEnd.toISOString(),
              requestedAt: new Date().toISOString()
            }
          }
        }
      })
      return NextResponse.json({
        downgradeScheduled: true,
        effectiveAt: proration!.currentPeriodEnd,
        message: `Plan change scheduled for ${proration!.currentPeriodEnd.toLocaleDateString('en-IN')} — your remaining paid period stays active until then.`
      })
    }

    const amountInPaise = Math.round(price * 100)
    // Razorpay caps receipt at 40 chars — short org suffix + timestamp (27 chars);
    // the full orgId travels in notes for reconciliation.
    const receipt = `ORD-${session.user.orgId.slice(-8)}-${Date.now()}`

    // 5. Create Razorpay GST Invoice (auto-creates the Checkout order and a
    // hosted invoice that becomes downloadable once paid). Adds 18% GST.
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: session.user.orgId },
      select: {
        name: true,
        email: true,
        phone: true,
        gstNumber: true,
        settings: true,
        branches: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { addressLine: true, city: true, state: true, pincode: true }
        }
      }
    })

    // GSTIN supplied at checkout is saved to the org billing profile
    if (gstin && gstin !== org.gstNumber) {
      await prisma.organization.update({
        where: { id: session.user.orgId },
        data: { gstNumber: gstin }
      })
    }
    const effectiveGstin = gstin ?? org.gstNumber ?? undefined
    // Dedicated billing address (settings.billingAddress) wins; branch fallback
    const storedBilling = ((org.settings as any) || {}).billingAddress as
      | { addressLine?: string; city?: string; state?: string; pincode?: string }
      | undefined
    const branch = storedBilling?.addressLine ? storedBilling : org.branches[0]

    const cycleLabel = billingCycle === 'ANNUAL' ? 'Annual' : billingCycle === 'QUARTERLY' ? 'Quarterly' : 'Monthly'
    const invoice = await createGstInvoice({
      customer: {
        name: org.name,
        email: org.email ?? undefined,
        contact: org.phone ?? undefined,
        gstin: effectiveGstin,
        billing_address: branch
          ? {
              line1: branch.addressLine ?? undefined,
              city: branch.city ?? undefined,
              state: branch.state ?? undefined,
              zipcode: branch.pincode ?? undefined,
              country: 'IN'
            }
          : undefined
      },
      lineItemName: creditApplied > 0
        ? `Vidhyaan ${plan.name} — ${cycleLabel} subscription (prorated)`
        : `Vidhyaan ${plan.name} — ${cycleLabel} subscription`,
      description: creditApplied > 0
        ? `₹${creditApplied.toFixed(2)} credit applied for ${proration!.remainingDays} unused day(s) on ${proration!.currentPlanName}`
        : `Student capacity slab ${pricing.slab.replace('S', 'up to ').replace('_PLUS', '+')}`,
      amountInPaise,
      receipt,
      gstInclusive: !!platform?.pricesIncludeGst,
      // Bill-To block — must ride on the invoice itself (customer dedupe
      // makes Razorpay ignore inline billing_address for known customers)
      billToText: [
        `Billed To: ${org.name}`,
        branch?.addressLine &&
          [branch.addressLine, branch.city, branch.state, branch.pincode].filter(Boolean).join(', '),
        effectiveGstin && `Customer GSTIN: ${effectiveGstin}`
      ]
        .filter(Boolean)
        .join(' | '),
      // Seller identification block — printed on the hosted invoice
      sellerTerms: [
        platform?.businessName && `Sold by: ${platform.businessName}`,
        platform?.businessAddress && `Address: ${platform.businessAddress}`,
        platform?.businessGstin && `GSTIN: ${platform.businessGstin}`,
        'SAC 998314 — Information technology services',
        'All payments are final and non-refundable; on cancellation the subscription remains active until the end of the paid period.'
      ]
        .filter(Boolean)
        .join(' | '),
      notes: { orgId: session.user.orgId, planSlug, billingCycle, slab: pricing.slab }
    })

    // 6. Save pending transaction to DB (amount = total charged, incl. GST)
    await prisma.transaction.create({
      data: {
        orgId: session.user.orgId,
        type: TransactionType.SUBSCRIPTION,
        status: 'PENDING',
        amount: invoice.amount / 100,
        currency: 'INR',
        gatewayRef: invoice.order_id,
        // Server-side truth for verify: slab priced into this order + invoice ref
        metadata: {
          planSlug,
          billingCycle,
          slab: pricing.slab,
          baseAmount: price, // net charged (after proration credit)
          // Renewal bills the undiscounted cycle price — coupons are one-time
          fullCyclePrice: undiscountedCycle,
          prorationCredit: creditApplied,
          ...(coupon ? { couponId: coupon.couponId, couponCode: coupon.code, couponPct: coupon.percentOff } : {}),
          gstInclusive: !!platform?.pricesIncludeGst,
          gstAmount: platform?.pricesIncludeGst
            ? Math.round((price - price / 1.18) * 100) / 100
            : invoice.amount / 100 - price,
          invoiceId: invoice.id,
          invoiceUrl: invoice.short_url
        }
      }
    })

    // 7. Return payload for frontend checkout
    // Checkout key MUST come from the same credential source as the
    // order/invoice creation and the verify fetch — env
    // NEXT_PUBLIC_RAZORPAY_KEY_ID could point at a DIFFERENT Razorpay account
    // than the admin-managed platform config, sending the payment where
    // fetchPayment can never find it ("id does not exist").
    const rzCreds = await getRazorpayCredentials()
    return NextResponse.json({
      orderId: invoice.order_id,
      amount: invoice.amount,
      currency: 'INR',
      keyId: rzCreds.keyId === 'mock_key' ? 'mock_public_key' : rzCreds.keyId
    })

  } catch (error: any) {
    console.error('Billing subscribe error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
