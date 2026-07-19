import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createGstInvoice } from '@/lib/integrations/razorpay'
import { TransactionType } from '@prisma/client'
import { getPack } from '@/lib/credits/constants'
import { getRazorpayCredentials } from '@/lib/platform-config'
import { nextPlatformInvoiceNumber } from '@/lib/billing/platform-invoice-number'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const parsed = z.object({ packId: z.string().min(1).max(50) }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }

    const pack = getPack(parsed.data.packId)
    if (!pack) {
      return NextResponse.json({ success: false, error: 'Credit pack not found' }, { status: 404 })
    }

    const amountInPaise = Math.round(pack.priceInr * 100)
    // Sequential platform invoice number (VID<year>-<seq>)
    const receipt = await nextPlatformInvoiceNumber()

    // GST invoice (same as subscriptions): auto-creates the Checkout order,
    // hosted invoice becomes downloadable once paid.
    const [org, platform] = await Promise.all([
      prisma.organization.findUniqueOrThrow({
        where: { id: session.user.orgId },
        select: { name: true, email: true, phone: true, gstNumber: true, settings: true }
      }),
      prisma.platformSettings.findUnique({ where: { id: 'default' } })
    ])
    const storedBilling = ((org.settings as any) || {}).billingAddress as
      | { addressLine?: string; city?: string; state?: string; pincode?: string }
      | undefined

    const invoice = await createGstInvoice({
      customer: {
        name: org.name,
        email: org.email ?? undefined,
        contact: org.phone ?? undefined,
        gstin: org.gstNumber ?? undefined
      },
      lineItemName: `Vidhyaan ${pack.channel} credit pack — ${pack.credits.toLocaleString('en-IN')} credits`,
      description: `Credit pack ${pack.id}`,
      amountInPaise,
      receipt,
      gstInclusive: !!platform?.pricesIncludeGst,
      billToText: [
        `Billed To: ${org.name}`,
        storedBilling?.addressLine &&
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
      notes: {
        orgId: session.user.orgId,
        packId: pack.id,
        channel: pack.channel,
        kind: 'CREDIT_PURCHASE'
      }
    })

    // metadata is the server-side truth used when granting credits — the
    // verify/webhook paths never trust client input for credit amounts.
    await prisma.transaction.create({
      data: {
        orgId: session.user.orgId,
        type: TransactionType.CREDIT_PURCHASE,
        status: 'PENDING',
        amount: invoice.amount / 100,
        currency: 'INR',
        gatewayRef: invoice.order_id,
        metadata: {
          channel: pack.channel,
          packId: pack.id,
          credits: pack.credits,
          invoiceId: invoice.id,
          invoiceUrl: invoice.short_url
        }
      }
    })

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
    console.error('Credit order error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
