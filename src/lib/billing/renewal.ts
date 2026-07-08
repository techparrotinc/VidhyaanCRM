import { prisma } from '@/lib/db'
import { createGstInvoice } from '@/lib/integrations/razorpay'
import { getEffectivePricing, priceForCycle } from '@/lib/pricing/effective'

/**
 * Auto-renew v1: at the first renewal reminder, a Razorpay GST invoice is
 * created for the next period and its hosted payment link rides in the
 * reminder email — one click to pay, no login needed. Payment lands through
 * the standard reconcile path (webhook / cron / page load), which extends the
 * period FROM the current period end (no days lost by paying early).
 *
 * Idempotent per billing period via org.settings.renewalInvoices[periodKey].
 * Returns the hosted payment URL, or null when nothing should be invoiced.
 */
export async function ensureRenewalInvoice(subscriptionId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      organization: { select: { id: true, name: true, email: true, phone: true, gstNumber: true, settings: true } }
    }
  })
  if (!sub || !sub.organization || !sub.currentPeriodEnd) return null
  if (sub.plan.slug === 'free' || Number(sub.amount) <= 0) return null // comped/free — nothing to bill

  const org = sub.organization
  const settings = (org.settings as any) || {}
  const periodKey = sub.currentPeriodEnd.toISOString()
  const existing = settings.renewalInvoices?.[periodKey] as string | undefined
  if (existing) return existing

  // Renew on the slab the org last paid for (slab re-check happens at checkout
  // anyway if they renew manually with a grown student count)
  const lastPaidTx = await prisma.transaction.findFirst({
    where: { orgId: org.id, type: 'SUBSCRIPTION', status: 'SUCCESS' },
    orderBy: { paidAt: 'desc' },
    select: { metadata: true }
  })
  const slab = ((lastPaidTx?.metadata as any)?.slab as any) ?? null

  const pricing = await getEffectivePricing(sub.planId, org.id, slab)
  const price = priceForCycle(pricing, sub.billingCycle as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL')
  if (price <= 0) return null

  const platform = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
  const storedBilling = (settings.billingAddress || {}) as {
    addressLine?: string
    city?: string
    state?: string
    pincode?: string
  }
  const cycleLabel = sub.billingCycle === 'ANNUAL' ? 'Annual' : sub.billingCycle === 'QUARTERLY' ? 'Quarterly' : 'Monthly'

  const invoice = await createGstInvoice({
    customer: {
      name: org.name,
      email: org.email ?? undefined,
      contact: org.phone ?? undefined,
      gstin: org.gstNumber ?? undefined
    },
    lineItemName: `Vidhyaan ${sub.plan.name} — ${cycleLabel} renewal`,
    description: `Renewal for period starting ${sub.currentPeriodEnd.toLocaleDateString('en-IN')}`,
    amountInPaise: Math.round(price * 100),
    receipt: `RNW-${org.id.slice(-8)}-${Date.now()}`,
    gstInclusive: !!platform?.pricesIncludeGst,
    billToText: [
      `Billed To: ${org.name}`,
      storedBilling.addressLine &&
        [storedBilling.addressLine, storedBilling.city, storedBilling.state, storedBilling.pincode]
          .filter(Boolean)
          .join(', '),
      org.gstNumber && `Customer GSTIN: ${org.gstNumber}`
    ]
      .filter(Boolean)
      .join(' | '),
    sellerTerms: [
      platform?.businessName && `Sold by: ${platform.businessName}`,
      platform?.businessAddress && `Address: ${platform.businessAddress}`,
      platform?.businessGstin && `GSTIN: ${platform.businessGstin}`,
      'SAC 998314 — Information technology services',
      'All payments are final and non-refundable.'
    ]
      .filter(Boolean)
      .join(' | '),
    notes: { orgId: org.id, planSlug: sub.plan.slug, billingCycle: sub.billingCycle, kind: 'RENEWAL' }
  })

  await prisma.transaction.create({
    data: {
      orgId: org.id,
      type: 'SUBSCRIPTION',
      status: 'PENDING',
      amount: invoice.amount / 100,
      currency: 'INR',
      gatewayRef: invoice.order_id,
      metadata: {
        planSlug: sub.plan.slug,
        billingCycle: sub.billingCycle,
        slab: pricing.slab,
        baseAmount: price,
        fullCyclePrice: price,
        renewal: true,
        gstInclusive: !!platform?.pricesIncludeGst,
        gstAmount: platform?.pricesIncludeGst
          ? Math.round((price - price / 1.18) * 100) / 100
          : invoice.amount / 100 - price,
        invoiceId: invoice.id,
        invoiceUrl: invoice.short_url
      }
    }
  })

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      settings: {
        ...settings,
        renewalInvoices: { ...(settings.renewalInvoices || {}), [periodKey]: invoice.short_url }
      }
    }
  })

  return invoice.short_url
}
