import crypto from 'crypto'
import QRCode from 'qrcode'
import { prisma } from '@/lib/db'
import { fetchPayment } from '@/lib/integrations/razorpay'
import type { SubscriptionInvoiceData } from '@/lib/pdf/subscription-invoice-pdf'

/**
 * Assembles the branded GST invoice PDF data for a platform payment
 * transaction. Layout facts (amounts, addresses, invoice number) come from
 * our records — the source of truth; payment settlement (id, method) is
 * fetched from Razorpay. Shared by the authed download route, the public
 * QR route and the payment-confirmation email attachment.
 */

const tokenSecret = () => process.env.NEXTAUTH_SECRET || 'invoice-token-secret'

/** Stateless share token for the public QR link: txId.hmac */
export function invoiceShareToken(txId: string): string {
  const sig = crypto.createHmac('sha256', tokenSecret()).update(txId).digest('hex').slice(0, 32)
  return `${txId}.${sig}`
}

export function verifyInvoiceShareToken(token: string): string | null {
  const [txId, sig] = token.split('.')
  if (!txId || !sig) return null
  const expected = crypto.createHmac('sha256', tokenSecret()).update(txId).digest('hex').slice(0, 32)
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  return crypto.timingSafeEqual(sigBuf, expBuf) ? txId : null
}

/** Public URL the invoice QR points at — our own PDF, same format as the download. */
export function publicInvoiceUrl(txId: string): string {
  const base = process.env.NEXTAUTH_URL || 'https://vidhyaan.com'
  return `${base}/api/public/billing/invoice/${invoiceShareToken(txId)}`
}

export async function buildSubscriptionInvoiceData(
  txId: string,
  orgId?: string
): Promise<SubscriptionInvoiceData | null> {
  const tx = await prisma.transaction.findFirst({
    where: { id: txId, ...(orgId ? { orgId } : {}) },
    include: { subscription: { select: { plan: { select: { name: true } } } } }
  })
  if (!tx || tx.status !== 'SUCCESS') return null

  const [org, platform] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: tx.orgId },
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
  const joinAddr = (
    a?: { addressLine?: string | null; city?: string | null; state?: string | null; pincode?: string | null } | null
  ) => (a ? [a.addressLine, a.city, a.state, a.pincode].filter(Boolean).join(', ') : null)

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
    payment = { id: tx.gatewayRef, method: fetched?.method ?? null, paidAt: tx.paidAt ?? null }
  } else if (tx.paidAt) {
    payment = { id: tx.gatewayRef ?? tx.id, method: null, paidAt: tx.paidAt }
  }

  // QR points at OUR public PDF (same format as the download), not the
  // Razorpay hosted page.
  const qrDataUrl = await QRCode.toDataURL(publicInvoiceUrl(tx.id), { margin: 0, width: 240 }).catch(
    () => null
  )

  const planName = tx.subscription?.plan?.name ?? meta.planSlug ?? 'Subscription'
  const cycle = (meta.billingCycle as string | undefined)?.toLowerCase()
  const slabLabel = (meta.slab as string | undefined)?.replace('S', 'up to ').replace('_PLUS', '+')
  const issuedAt = tx.paidAt ?? tx.createdAt

  return {
    invoiceNo: (meta.invoiceNo as string | undefined) ?? `VID-${tx.id.slice(-8).toUpperCase()}`,
    date: issuedAt,
    dueDate: issuedAt,
    poNumber: (settings.billingPoNumber as string | undefined) ?? null,
    placeOfSupply: billing?.state ?? null,
    userEmail: org.email ?? null,
    seller: {
      name: platform?.businessName ?? 'Vidhyaan',
      address: platform?.businessAddress ?? null,
      gstin: platform?.businessGstin ?? null,
      signatoryName: platform?.signatoryName ?? null,
      signatoryImageUrl: platform?.signatoryImageUrl ?? null,
      stampImageUrl: platform?.stampImageUrl ?? null
    },
    billTo: {
      name: org.name,
      attn: org.email ?? null,
      address: joinAddr(billing),
      gstin: org.gstNumber ?? null
    },
    shipTo: { name: org.name, address: joinAddr(shipping) },
    item: {
      description:
        tx.type === 'CREDIT_PURCHASE' ? 'Vidhyaan messaging credits' : `Vidhyaan ${planName} subscription`,
      details: [
        'Service : Vidhyaan Platform',
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
}
