import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { verifyPayment } from '@/lib/integrations/razorpay'
import { sendEmail } from '@/lib/integrations/resend'
import { AuditAction, SubscriptionStatus, BillingCycle } from '@prisma/client'

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

    if (!user || user.role !== 'ORG_ADMIN' || !user.orgId || !user.organization) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse request
    const body = await req.json()
    const { orderId, paymentId, signature, planSlug, billingCycle } = body

    if (!orderId || !paymentId || !signature || !planSlug || !billingCycle) {
      return NextResponse.json({ success: false, error: 'Missing parameter values' }, { status: 400 })
    }

    // 3. Verify signature
    const isValid = verifyPayment(orderId, paymentId, signature)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // 4. Find plan
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug, isActive: true }
    })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    // 5. Update transaction
    const transaction = await prisma.transaction.findFirst({
      where: { gatewayRef: orderId, orgId: user.orgId }
    })

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          gatewayRef: paymentId,
          paidAt: new Date()
        }
      })
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

    const monthly = Number(plan.monthlyPrice)
    let price = monthly
    if (billingCycle === 'QUARTERLY') {
      price = plan.quarterlyPrice ? Number(plan.quarterlyPrice) : monthly * 3 * 0.9
    } else if (billingCycle === 'ANNUAL') {
      price = plan.annualPrice ? Number(plan.annualPrice) : monthly * 12 * 0.75
    }

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

    // 8. Update Organization plan status
    await prisma.organization.update({
      where: { id: user.orgId },
      data: {
        planId: plan.id,
        trialEndsAt: null,
        status: 'ACTIVE'
      }
    })

    // 9. Send payment success email
    const orgEmail = user.organization.email || user.email
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
        </div>
      </div>
    `

    await sendEmail(
      orgEmail,
      `Payment Successful: ${plan.name} Plan Activated!`,
      paymentSuccessHtml
    ).catch(err => console.error('Failed to send payment verification email:', err))

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

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Verify checkout payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
