import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { verifyPayment, fetchPayment } from '@/lib/integrations/razorpay'
import { getEffectivePricing, priceForCycle } from '@/lib/pricing/effective'
import { recordCouponRedemption } from '@/lib/billing/coupons'
import { syncBundledAiAllowance } from '@/lib/billing/lifecycle'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { AuditAction, SubscriptionStatus, BillingCycle } from '@prisma/client'
import { redis } from '@/lib/redis'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (session.user.role !== 'ORG_ADMIN' || !user || !user.orgId || !user.organization) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse request — invoice-backed Checkout callbacks may omit orderId
    // and signature (they return invoice fields instead), so both are optional
    // and the API-fetch path below covers them.
    const parsed = z.object({
      orderId: z.string().min(1).optional(),
      paymentId: z.string().min(1),
      signature: z.string().min(1).optional(),
      planSlug: z.string().min(1),
      billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
    }).safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { paymentId, signature, planSlug, billingCycle } = parsed.data
    let { orderId } = parsed.data

    // 3. Verify payment: order signature when present, else authenticated
    // API fetch (server-to-server; equally trustworthy, fails closed).
    let verified = false
    let fetchedPayment: Awaited<ReturnType<typeof fetchPayment>> = null
    if (orderId && signature) {
      verified = await verifyPayment(orderId, paymentId, signature)
    }
    if (!verified) {
      fetchedPayment = await fetchPayment(paymentId)
      if (fetchedPayment && ['captured', 'authorized'].includes(fetchedPayment.status)) {
        if (fetchedPayment.order_id) orderId = fetchedPayment.order_id
        verified = !!orderId || paymentId.startsWith('pay_mock_')
      }
    }
    if (!verified || (!orderId && !paymentId.startsWith('pay_mock_'))) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // 4. Find plan
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug, isActive: true }
    })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    // 5. Update transaction (gatewayRef = the order id the payment settled)
    const transaction = orderId
      ? await prisma.transaction.findFirst({
          where: { gatewayRef: orderId, orgId: user.orgId }
        })
      : null

    // Amount guard on the API-fetch path: paid amount must match the order
    if (transaction && fetchedPayment && fetchedPayment.amount > 0) {
      const expectedPaise = Math.round(Number(transaction.amount) * 100)
      if (fetchedPayment.amount !== expectedPaise) {
        return NextResponse.json({ success: false, error: 'Payment amount mismatch' }, { status: 400 })
      }
    }

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          gatewayRef: paymentId,
          paidAt: new Date(),
          // Hosted Razorpay GST invoice becomes downloadable once paid
          invoiceUrl: ((transaction.metadata as any)?.invoiceUrl as string | undefined) ?? undefined
        }
      })
      const couponId = (transaction.metadata as any)?.couponId as string | undefined
      if (couponId) {
        await recordCouponRedemption(couponId, user.orgId, transaction.id)
      }
    }

    // 6. Calculate renewal periods
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    if (billingCycle === 'MONTHLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else if (billingCycle === 'QUARTERLY') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3)
    } else if (billingCycle === 'ANNUAL') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Slab-aware price — the slab priced into the order was persisted on the
    // pending transaction at order creation (server-side truth, not client input)
    const orderSlab = (transaction?.metadata as any)?.slab as
      | 'S50' | 'S100' | 'S200' | 'S500' | 'S500_PLUS' | undefined
    const pricing = await getEffectivePricing(plan.id, user.orgId, orderSlab ?? null)
    const price = priceForCycle(pricing, billingCycle as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL')

    // Find or create Subscription
    let subscription = await prisma.subscription.findFirst({
      where: { orgId: user.orgId }
    })

    const subData = {
      orgId: user.orgId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: billingCycle as BillingCycle,
      amount: price,
      startedAt: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      trialEndsAt: null,
      // A fresh payment supersedes any pending cancellation or grace state
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
      gatewaySubId: null // One-time order verification path
    }

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: subData
      })
    } else {
      subscription = await prisma.subscription.create({
        data: subData
      })
    }

    // Link transaction to subscription if transaction existed
    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          subscriptionId: subscription.id
        }
      })
    }

    // 7. Enable plan modules for organization
    const planModules = await prisma.planModule.findMany({
      where: { planId: plan.id }
    })

    for (const pm of planModules) {
      const dbModule = await prisma.module.findUnique({
        where: { slug: pm.moduleSlug }
      })
      if (dbModule) {
        await prisma.organizationModule.upsert({
          where: {
            orgId_moduleId: {
              orgId: user.orgId,
              moduleId: dbModule.id
            }
          },
          update: {
            enabled: true,
            enabledAt: new Date(),
            disabledAt: null
          },
          create: {
            orgId: user.orgId,
            moduleId: dbModule.id,
            enabled: true,
            enabledAt: new Date()
          }
        })
      }
    }

    // 7.5 Grant the slab's bundled monthly AI credit allowance
    await syncBundledAiAllowance(
      user.orgId,
      plan.id,
      (transaction?.metadata as any)?.slab ?? pricing.slab
    ).catch((e) => console.error('AI allowance sync failed:', e))

    // 8. Update Organization plan status; a paid plan change supersedes any
    // previously scheduled (downgrade) plan change
    const { pendingPlanChange: _superseded, ...cleanSettings } =
      ((user.organization.settings as any) || {})
    await prisma.organization.update({
      where: { id: user.orgId },
      data: {
        planId: plan.id,
        trialEndsAt: null,
        status: 'ACTIVE',
        settings: cleanSettings
      }
    })

    // 9. Send payment success email
    const orgEmail = user.organization.email || user.email || ''
    const paymentSuccessHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #1565D8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">Payment Successful! 🎉</h1>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
          <p>Hi ${user.name},</p>
          <p>Thank you for your payment! Your subscription is active, and your billing period has been updated.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #f1f5f9;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 16px; font-weight: bold; color: #475569; width: 40%;">Plan:</td>
                <td style="padding: 10px 16px; color: #0f172a; font-weight: bold;">${plan.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Billing Cycle:</td>
                <td style="padding: 10px 16px; color: #0f172a;">${billingCycle}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Amount Paid:</td>
                <td style="padding: 10px 16px; font-weight: bold; color: #1565D8; font-size: 16px;">INR ${price}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Next Renewal Date:</td>
                <td style="padding: 10px 16px; color: #0f172a;">${currentPeriodEnd.toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/settings/billing" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Go to Billing Dashboard</a>
          </div>
          ${(transaction?.metadata as any)?.invoiceUrl ? `
          <p style="text-align: center; font-size: 12px; margin-top: -14px;">
            <a href="${(transaction!.metadata as any).invoiceUrl}" style="color: #1565D8; font-weight: bold;">Download your GST invoice</a>
          </p>` : ''}
        </div>
      </div>
    `

    await sendTransactionalEmail({
      to: orgEmail,
      subject: `Payment Successful: ${plan.name} Plan Activated!`,
      htmlBody: paymentSuccessHtml,
      textBody: `Your payment was successful and the ${plan.name} Plan is activated.`
    }).catch(err => console.error('Failed to send payment verification email:', err))

    // 10. Audit logging
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        action: AuditAction.UPDATE,
        entityType: 'SUBSCRIPTION',
        entityId: subscription.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
        after: {
          planId: plan.id,
          billingCycle,
          amount: price,
          status: 'ACTIVE',
          currentPeriodEnd
        }
      }
    }).catch(e => console.error('Failed to write verification audit log:', e))

    // Invalidate organization and module caches
    try {
      await redis.del(`org:${user.orgId}`)
      await Promise.all(
        planModules.map((pm) => redis.del(`org:${user.orgId}:module:${pm.moduleSlug}`))
      )
    } catch (err) {
      console.error('Failed to invalidate billing caches:', err)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Verify checkout payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
