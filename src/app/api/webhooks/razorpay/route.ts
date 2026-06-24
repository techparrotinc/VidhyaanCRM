import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { sendPaymentFailedEmail } from '@/lib/services/billing'
import { SubscriptionStatus, TransactionType, TransactionStatus, OrgStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.warn('[Razorpay Webhook] Webhook secret not configured, skipping validation.')
    } else {
      // Validate signature against the raw body text
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

      // Fallback signature check using the stringified parsed payload (some systems order props)
      const expectedSignatureStringify = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(JSON.parse(rawBody)))
        .digest('hex')

      if (signature !== expectedSignature && signature !== expectedSignatureStringify) {
        console.error('[Razorpay Webhook] Cryptographic signature validation failed.')
        // Return 200 to prevent Razorpay from repeatedly retrying bad payloads
        return NextResponse.json({ success: true, message: 'Signature mismatch' })
      }
    }

    const event = JSON.parse(rawBody)
    const eventName = event.event
    console.log(`[Razorpay Webhook] Received event: ${eventName}`)

    switch (eventName) {
      case 'payment.captured': {
        const paymentEntity = event.payload.payment.entity
        const orderId = paymentEntity.order_id
        const paymentId = paymentEntity.id

        // Find transaction
        const transaction = await prisma.transaction.findFirst({
          where: { gatewayRef: orderId }
        })

        if (transaction) {
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.SUCCESS,
              gatewayRef: paymentId,
              paidAt: new Date()
            }
          })

          // Activate subscription
          const subscription = await prisma.subscription.findFirst({
            where: { orgId: transaction.orgId }
          })

          if (subscription && subscription.status !== SubscriptionStatus.ACTIVE) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.ACTIVE,
                startedAt: new Date()
              }
            })
          }
        }
        break
      }

      case 'payment.failed': {
        const paymentEntity = event.payload.payment.entity
        const orderId = paymentEntity.order_id
        const paymentId = paymentEntity.id
        const amount = Number(paymentEntity.amount) / 100

        const transaction = await prisma.transaction.findFirst({
          where: { gatewayRef: orderId }
        })

        if (transaction) {
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.FAILED,
              gatewayRef: paymentId
            }
          })

          // Trigger email to admin
          await sendPaymentFailedEmail(transaction.orgId, amount).catch(err =>
            console.error('[Razorpay Webhook] Failed to trigger payment failure email:', err)
          )

          // Mark subscription past due if it exists
          const subscription = await prisma.subscription.findFirst({
            where: { orgId: transaction.orgId }
          })

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: SubscriptionStatus.PAST_DUE }
            })
          }
        }
        break
      }

      case 'subscription.charged': {
        const subEntity = event.payload.subscription.entity
        const gatewaySubId = subEntity.id
        const currentStart = subEntity.current_start
        const currentEnd = subEntity.current_end
        const paymentId = event.payload.payment?.entity?.id || 'renewal_charged'

        // Locate local subscription record
        const subscription = await prisma.subscription.findFirst({
          where: { gatewaySubId }
        })

        if (subscription) {
          // Update period dates
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              startedAt: new Date(currentStart * 1000),
              currentPeriodEnd: new Date(currentEnd * 1000)
            }
          })

          // Create renewal transaction record
          await prisma.transaction.create({
            data: {
              orgId: subscription.orgId,
              subscriptionId: subscription.id,
              type: TransactionType.RENEWAL,
              status: TransactionStatus.SUCCESS,
              amount: subscription.amount,
              currency: 'INR',
              gatewayRef: paymentId,
              paidAt: new Date()
            }
          })
        }
        break
      }

      case 'subscription.cancelled': {
        const subEntity = event.payload.subscription.entity
        const gatewaySubId = subEntity.id

        const subscription = await prisma.subscription.findFirst({
          where: { gatewaySubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.CANCELLED,
              cancelAtPeriodEnd: true
            }
          })

          // Downgrade organization status at period end check could be scheduled here,
          // but for basic mapping we label the subscription as cancelled.
        }
        break
      }

      case 'subscription.halted': {
        const subEntity = event.payload.subscription.entity
        const gatewaySubId = subEntity.id

        const subscription = await prisma.subscription.findFirst({
          where: { gatewaySubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.EXPIRED
            }
          })

          // Lock CRM write access by updating org status to PAST_DUE
          await prisma.organization.update({
            where: { id: subscription.orgId },
            data: {
              status: OrgStatus.PAST_DUE
            }
          })
        }
        break
      }

      default:
        console.log(`[Razorpay Webhook] Event ignored: ${eventName}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[Razorpay Webhook] Handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
