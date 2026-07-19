import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { fetchPayment } from '@/lib/integrations/razorpay'
import {
  renderSubscriptionInvoicePdf,
  SubscriptionInvoiceData
} from '@/lib/pdf/subscription-invoice-pdf'

/**
 * Branded GST invoice PDF for a platform subscription / credit-pack payment.
 * Layout facts (amounts, addresses, invoice number) come from our records —
 * the source of truth, since prices are always computed server-side; payment
 * settlement (id, method, paid time) is fetched live from Razorpay so the
 * "Payment Made" stamp never claims more than the gateway confirms.
 */
export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user, params }) => {
    const tx = await prisma.transaction.findFirst({
      where: { id: params?.id as string, orgId: user.orgId },
      include: { subscription: { select: { plan: { select: { name: true } } } } }
    })
    if (!tx) throw Errors.notFound('Invoice')
    if (tx.status !== 'SUCCESS') {
      throw Errors.businessRule('Invoice is available after the payment succeeds')
    }

    const [org, platform] = await Promise.all([
      prisma.organization.findUniqueOrThrow({
        where: { id: user.orgId },
        select: {
          name: true,
          email: true,
          gstNumber: true,
          settings: true,
          branches: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { addressLine: true, city: true, state: true, pincode: true }
          }
        }
      }),
      prisma.platformSettings.findUnique({ where: { id: 'default' } })
    ])

    const meta = (tx.metadata as any) || {}
    const settings = (org.settings as any) || {}

    // Addresses: stored billing profile wins, main branch is the fallback;
    // Ship-To falls back to Bill-To.
    const billing = settings.billingAddress?.addressLine ? settings.billingAddress : org.branches[0]
    const shipping = settings.shippingAddress?.addressLine ? settings.shippingAddress : billing
    const joinAddr = (a?: { addressLine?: string | null; city?: string | null; state?: string | null; pincode?: string | null } | null) =>
      a ? [a.addressLine, a.city, a.state, a.pincode].filter(Boolean).join(', ') : null

    // Paise-exact GST split from the stored transaction (gstAmount was
    // computed at checkout; SGST takes the remainder).
    const totalPaise = Math.round(Number(tx.amount) * 100)
    const gstPaise = Math.round(Number(meta.gstAmount ?? 0) * 100)
    const basePaise = totalPaise - gstPaise
    const cgstPaise = Math.floor(gstPaise / 2)

    // Settlement facts from Razorpay (gatewayRef holds the payment id after
    // verify). Fail open to our own paidAt if the gateway is unreachable.
    let payment: SubscriptionInvoiceData['payment'] = null
    if (tx.gatewayRef?.startsWith('pay_')) {
      const fetched = await fetchPayment(tx.gatewayRef)
      payment = {
        id: tx.gatewayRef,
        method: (fetched as any)?.method ?? null,
        paidAt: tx.paidAt ?? null
      }
    } else if (tx.paidAt) {
      payment = { id: tx.gatewayRef ?? tx.id, method: null, paidAt: tx.paidAt }
    }

    const invoiceUrl = (meta.invoiceUrl as string | undefined) ?? tx.invoiceUrl ?? null
    const qrDataUrl = invoiceUrl
      ? await QRCode.toDataURL(invoiceUrl, { margin: 0, width: 240 }).catch(() => null)
      : null

    const planName = tx.subscription?.plan?.name ?? meta.planSlug ?? 'Subscription'
    const cycle = (meta.billingCycle as string | undefined)?.toLowerCase()
    const slabLabel = (meta.slab as string | undefined)?.replace('S', 'up to ').replace('_PLUS', '+')
    const issuedAt = tx.paidAt ?? tx.createdAt

    const data: SubscriptionInvoiceData = {
      invoiceNo: (meta.invoiceNo as string | undefined) ?? `VID-${tx.id.slice(-8).toUpperCase()}`,
      date: issuedAt,
      dueDate: issuedAt,
      poNumber: (settings.billingPoNumber as string | undefined) ?? null,
      placeOfSupply: billing?.state ?? null,
      userEmail: org.email ?? null,
      seller: {
        name: platform?.businessName ?? 'Vidhyaan',
        address: platform?.businessAddress ?? null,
        gstin: platform?.businessGstin ?? null
      },
      billTo: {
        name: org.name,
        attn: org.email ?? null,
        address: joinAddr(billing),
        gstin: org.gstNumber ?? null
      },
      shipTo: { name: org.name, address: joinAddr(shipping) },
      item: {
        description: tx.type === 'CREDIT_PURCHASE'
          ? 'Vidhyaan messaging credits'
          : `Vidhyaan ${planName} subscription`,
        details: [
          `Service : Vidhyaan Platform`,
          cycle ? `Payment Duration : ${cycle.charAt(0).toUpperCase() + cycle.slice(1)}` : '',
          slabLabel ? `Student capacity : ${slabLabel} students` : '',
          meta.couponCode ? `Coupon applied : ${meta.couponCode} (${meta.couponPct}% off)` : '',
          meta.prorationCredit > 0 ? `Proration credit applied : Rs.${Number(meta.prorationCredit).toFixed(2)}` : ''
        ].filter(Boolean),
        qty: 1,
        rate: basePaise / 100,
        sac: '998314'
      },
      amounts: {
        base: basePaise / 100,
        cgst: cgstPaise / 100,
        sgst: (gstPaise - cgstPaise) / 100,
        total: totalPaise / 100,
        paid: totalPaise / 100
      },
      payment,
      qrDataUrl,
      notes: [
        'Thanks for your business.',
        'All payments are final and non-refundable; on cancellation the subscription remains active until the end of the paid period.',
        ...(platform?.supportEmail ? [`For GST queries, please contact: ${platform.supportEmail}`] : [])
      ]
    }

    const buffer = await renderSubscriptionInvoicePdf(data)
    return new NextResponse(buffer as never, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.invoiceNo}.pdf"`
      }
    })
  }
})
