import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { sendPaymentFailedEmail } from '@/lib/services/billing'
import { SubscriptionStatus, TransactionType, TransactionStatus, OrgStatus, type MessageChannel } from '@prisma/client'
import { grantPurchasedCredits } from '@/lib/credits/engine'
import { getRazorpayWebhookSecret } from '@/lib/platform-config'
import { postSlackAlert } from '@/lib/alerts/slack'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
    }

    const secret = await getRazorpayWebhookSecret()
    if (!secret) {
      // Fail closed: an unverifiable webhook must never mutate billing state.
      console.error('[Razorpay Webhook] webhook secret not configured; rejecting webhook.')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const timingSafeMatch = (expectedHex: string) => {
      try {
        const a = Buffer.from(expectedHex, 'hex')
        const b = Buffer.from(signature, 'hex')
        return a.length === b.length && crypto.timingSafeEqual(a, b)
      } catch {
        return false
      }
    }

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

    if (!timingSafeMatch(expectedSignature) && !timingSafeMatch(expectedSignatureStringify)) {
      console.error('[Razorpay Webhook] Cryptographic signature validation failed.')
      // Return 200 to prevent Razorpay from repeatedly retrying bad payloads
      return NextResponse.json({ success: true, message: 'Signature mismatch' })
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

        if (transaction && transaction.type === TransactionType.CREDIT_PURCHASE) {
          // Credit-pack purchase: idempotent claim (verify route may have
          // already processed it) + idempotent grant. No subscription side
          // effects for this transaction type.
          const claimed = await prisma.transaction.updateMany({
            where: { id: transaction.id, status: TransactionStatus.PENDING },
            data: {
              status: TransactionStatus.SUCCESS,
              gatewayRef: paymentId,
              paidAt: new Date()
            }
          })
          if (claimed.count > 0) {
            const meta = transaction.metadata as { channel?: string; credits?: number } | null
            if (meta?.channel && meta?.credits) {
              await grantPurchasedCredits(
                transaction.orgId,
                meta.channel as MessageChannel,
                meta.credits,
                transaction.id
              )
            } else {
              console.error('[Razorpay Webhook] Credit purchase metadata missing', transaction.id)
            }
          }
          break
        }

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

      case 'refund.processed': {
        // Vidhyaan's policy is no-refunds, so any refund here was issued
        // manually from the Razorpay dashboard — reflect it and alert ops.
        const refundEntity = event.payload.refund.entity
        const paymentId = refundEntity.payment_id

        const transaction = await prisma.transaction.findFirst({
          where: { gatewayRef: paymentId }
        })
        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.REFUNDED }
          })
          await prisma.auditLog
            .create({
              data: {
                orgId: transaction.orgId,
                action: 'UPDATE',
                entityType: 'TRANSACTION',
                entityId: transaction.id,
                after: {
                  status: 'REFUNDED',
                  refundId: refundEntity.id,
                  amount: refundEntity.amount / 100,
                  source: 'razorpay_dashboard'
                }
              }
            })
            .catch(() => {})

          const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
          try {
            const { sendTransactionalEmail } = await import('@/lib/integrations/zeptomail')
            if (settings?.opsAlertEmail) {
              await sendTransactionalEmail({
                to: settings.opsAlertEmail,
                subject: `⚠ Refund processed — ₹${(refundEntity.amount / 100).toLocaleString('en-IN')} (org ${transaction.orgId})`,
                htmlBody: `<p>Razorpay refund <strong>${refundEntity.id}</strong> processed for payment ${paymentId} (transaction ${transaction.id}, org ${transaction.orgId}).</p><p>The transaction is now marked REFUNDED. Review the org's subscription — refunds are outside Vidhyaan's standard no-refund policy, so the plan was NOT auto-deactivated.</p>`,
                textBody: `Refund ${refundEntity.id} processed for payment ${paymentId}.`
              })
            }
          } catch (e) {
            console.error('[Razorpay Webhook] refund ops alert failed:', e)
          }
          postSlackAlert(`⚠ Razorpay refund ${refundEntity.id} — ₹${(refundEntity.amount / 100).toLocaleString('en-IN')} (org ${transaction.orgId}). Transaction marked REFUNDED.`)
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
          // Mark failed but KEEP gatewayRef = order id: Checkout retries pay
          // against the same order, and reconciliation matches by order id to
          // recover a captured retry. Failed payment id goes into metadata.
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.FAILED,
              metadata: {
                ...((transaction.metadata as any) || {}),
                failedPaymentId: paymentId,
                failedAt: new Date().toISOString()
              }
            }
          })

          // A failed credit-pack purchase must not touch the subscription
          if (transaction.type === TransactionType.CREDIT_PURCHASE) {
            break
          }

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
