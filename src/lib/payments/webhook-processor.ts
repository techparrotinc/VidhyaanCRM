import { Prisma, GatewayOrderStatus, GatewayProvider, PaymentStatus, RefundStatus, WebhookEventStatus, type PaymentGatewayConfig } from '@prisma/client'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { sumSuccessfulPayments, nextInvoiceStatus } from '@/lib/fees'
import { getProvider } from './registry'
import { decryptSecret } from './vault'
import { applyGatewayPayment } from './checkout'
import type { NormalizedGatewayEvent } from './provider'

/**
 * Fee-payment webhook pipeline: verify → dedupe → persist → apply → ack.
 * The persisted WebhookEvent row is a durable inbox — any event that fails to
 * apply is replayed by the retry cron (PR6) or manually.
 *
 * Distinct from src/app/api/webhooks/razorpay (platform subscription billing,
 * platform-level secret). This pipeline uses each org's own webhook secret.
 */

export type WebhookOutcome =
  | { status: 200; body: { received: true; result: string } }
  | { status: 401 | 404 | 400 | 500; body: { error: string } }

const DEDUPE_TTL_SECONDS = 48 * 60 * 60

export async function processGatewayWebhook(input: {
  orgId: string
  provider: GatewayProvider
  rawBody: string
  signature: string | null
  headerEventId: string | null
}): Promise<WebhookOutcome> {
  // 1. Resolve org config for the CURRENT environment. Fall back across
  // environments: Razorpay test + live webhooks can both be registered.
  const configs = await prisma.paymentGatewayConfig.findMany({
    where: { orgId: input.orgId, provider: input.provider, deletedAt: null }
  })
  if (configs.length === 0) {
    return { status: 404, body: { error: 'Not found' } }
  }

  if (!input.signature) {
    return { status: 401, body: { error: 'Missing signature' } }
  }

  // 2. Verify against each environment's secret; the matching one tells us
  // which environment sent the event.
  const provider = getProvider(input.provider)
  let config: PaymentGatewayConfig | null = null
  for (const candidate of configs) {
    const secret = decryptSecret(candidate.webhookSecretEnc)
    if (provider.verifyWebhookSignature(input.rawBody, input.signature, secret)) {
      config = candidate
      break
    }
  }

  let event: NormalizedGatewayEvent
  try {
    event = provider.parseWebhook(input.rawBody)
  } catch {
    return { status: 400, body: { error: 'Malformed payload' } }
  }
  const providerEventId = input.headerEventId ?? event.providerEventId

  if (!config) {
    // Persist for forensics, never apply. 401 → Razorpay does not retry 4xx.
    await persistEvent({
      orgId: input.orgId,
      provider: input.provider,
      providerEventId,
      eventType: event.rawType,
      signatureValid: false,
      status: WebhookEventStatus.SKIPPED,
      rawBody: input.rawBody,
      error: 'Signature verification failed'
    })
    return { status: 401, body: { error: 'Invalid signature' } }
  }

  // 3. Webhook health + first-event verification for the setup wizard
  await prisma.paymentGatewayConfig.update({
    where: { id: config.id },
    data: {
      lastWebhookAt: new Date(),
      webhookVerifiedAt: config.webhookVerifiedAt ?? new Date()
    }
  }).catch(err => console.error('[webhook] health stamp failed:', err))

  // 4. Idempotency — Redis fast path (best effort), DB unique as backstop.
  const dedupeKey = `webhook:${input.provider}:${providerEventId}`
  const seen = await redis.get(dedupeKey).catch(() => null)
  if (seen) {
    return { status: 200, body: { received: true, result: 'duplicate' } }
  }

  const eventRow = await persistEvent({
    orgId: input.orgId,
    provider: input.provider,
    providerEventId,
    eventType: event.rawType,
    signatureValid: true,
    status: WebhookEventStatus.RECEIVED,
    rawBody: input.rawBody
  })
  if (!eventRow) {
    // Unique violation — another delivery already owns this event.
    return { status: 200, body: { received: true, result: 'duplicate' } }
  }
  await redis.set(dedupeKey, '1', 'EX', DEDUPE_TTL_SECONDS).catch(() => undefined)

  // 5. Apply. Failures mark the event FAILED and return 500 so Razorpay
  // retries on its backoff schedule; the retry cron is the second net.
  try {
    const result = await applyGatewayEvent(input.orgId, event)
    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: {
        status: result.applied ? WebhookEventStatus.PROCESSED : WebhookEventStatus.SKIPPED,
        error: result.applied ? null : result.reason,
        processedAt: new Date(),
        attempts: { increment: 1 }
      }
    })
    return { status: 200, body: { received: true, result: result.applied ? 'processed' : `skipped: ${result.reason}` } }
  } catch (error) {
    console.error('[webhook] apply failed:', error)
    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: {
        status: WebhookEventStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        attempts: { increment: 1 }
      }
    }).catch(() => undefined)
    return { status: 500, body: { error: 'Processing failed' } }
  }
}

async function persistEvent(input: {
  orgId: string
  provider: GatewayProvider
  providerEventId: string
  eventType: string
  signatureValid: boolean
  status: WebhookEventStatus
  rawBody: string
  error?: string
}) {
  try {
    return await prisma.webhookEvent.create({
      data: {
        orgId: input.orgId,
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        signatureValid: input.signatureValid,
        status: input.status,
        payload: JSON.parse(input.rawBody),
        error: input.error
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null // duplicate providerEventId
    }
    throw error
  }
}

/**
 * Business application of one verified, deduplicated event. Exported so the
 * retry cron (PR6) can replay FAILED events through the same code path.
 */
export async function applyGatewayEvent(
  orgId: string,
  event: NormalizedGatewayEvent
): Promise<{ applied: boolean; reason?: string }> {
  switch (event.type) {
    case 'payment.captured':
    case 'order.paid': {
      if (!event.providerOrderId) return { applied: false, reason: 'no order id in payload' }
      const order = await prisma.gatewayOrder.findFirst({
        where: { provider: 'RAZORPAY', providerOrderId: event.providerOrderId }
      })
      if (!order) {
        // Not an invoice checkout — may be a digital-form application fee,
        // whose order id lives on FormInstance.gatewayRef. Settle it here as a
        // fallback to the browser confirm (idempotent).
        const inst = await prisma.formInstance.findFirst({
          where: { orgId, gatewayRef: event.providerOrderId }
        })
        if (inst) {
          if (inst.paymentStatus !== 'PAID') {
            await prisma.formInstance.update({ where: { id: inst.id }, data: { paymentStatus: 'PAID' } })
            const { finalizeFeePaidSubmission } = await import('@/lib/forms/finalize')
            await finalizeFeePaidSubmission(inst.id)
          }
          return { applied: true }
        }
        return { applied: false, reason: 'unknown order' }
      }
      // Cross-tenant guard: the path org must own the order.
      if (order.orgId !== orgId) return { applied: false, reason: 'org mismatch' }
      if (!event.providerPaymentId) return { applied: false, reason: 'no payment id in payload' }
      // Never trust the payload amount over our own record.
      if (event.amountMinor !== undefined && event.amountMinor !== Math.round(Number(order.amount) * 100)) {
        throw new Error(`amount mismatch: payload ${event.amountMinor}, order ${order.amount}`)
      }
      const result = await applyGatewayPayment({
        order,
        providerPaymentId: event.providerPaymentId,
        method: event.method
      })
      if (!result.duplicate) {
        await notifyPaymentReceived(order.orgId, order.invoiceId, Number(order.amount))
      }
      return { applied: true }
    }

    case 'payment.failed': {
      if (!event.providerOrderId) return { applied: false, reason: 'no order id in payload' }
      const order = await prisma.gatewayOrder.findFirst({
        where: { provider: 'RAZORPAY', providerOrderId: event.providerOrderId }
      })
      if (!order) return { applied: false, reason: 'unknown order' }
      if (order.orgId !== orgId) return { applied: false, reason: 'org mismatch' }
      if (order.status === GatewayOrderStatus.PAID) {
        return { applied: false, reason: 'order already paid' } // late failure of an earlier attempt
      }
      await prisma.gatewayOrder.update({
        where: { id: order.id },
        data: {
          status: GatewayOrderStatus.ATTEMPTED,
          providerPaymentId: event.providerPaymentId,
          failureCode: event.errorCode,
          failureReason: event.errorReason
        }
      })
      return { applied: true }
    }

    case 'refund.processed':
    case 'refund.failed': {
      if (!event.providerRefundId || !event.providerPaymentId) {
        return { applied: false, reason: 'missing refund/payment id' }
      }
      const payment = await prisma.payment.findFirst({
        where: { orgId, gatewayRef: event.providerPaymentId, deletedAt: null }
      })
      // Out-of-order refund before capture: throw so the event goes FAILED
      // and is retried after the capture lands.
      if (!payment) throw new Error('refund for unknown payment — parking for retry')

      if (event.type === 'refund.failed') {
        await prisma.refund.updateMany({
          where: { orgId, providerRefundId: event.providerRefundId },
          data: { status: RefundStatus.FAILED }
        })
        return { applied: true }
      }

      const amount = event.amountMinor !== undefined
        ? new Prisma.Decimal(event.amountMinor).div(100)
        : payment.amount

      await prisma.$transaction(async (tx) => {
        // Upsert-by-hand: refunds initiated from the Razorpay dashboard have
        // no local Refund row yet — create one so reconciliation holds.
        const existing = await tx.refund.findFirst({
          where: { orgId, providerRefundId: event.providerRefundId }
        })
        if (existing) {
          if (existing.status === RefundStatus.PROCESSED) return // replay no-op
          await tx.refund.update({
            where: { id: existing.id },
            data: { status: RefundStatus.PROCESSED, processedAt: new Date() }
          })
        } else {
          await tx.refund.create({
            data: {
              orgId,
              paymentId: payment.id,
              amount,
              status: RefundStatus.PROCESSED,
              providerRefundId: event.providerRefundId,
              reason: 'Initiated at gateway',
              initiatedById: 'gateway',
              processedAt: new Date()
            }
          })
        }

        const refundedAmount = Number(payment.refundedAmount) + Number(amount)
        const fullyRefunded = refundedAmount >= Number(payment.amount)
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmount: new Prisma.Decimal(refundedAmount),
            status: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED
          }
        })

        // Recompute invoice: refunded portion no longer counts as paid.
        const invoice = await tx.invoice.findFirstOrThrow({
          where: { id: payment.invoiceId, orgId },
          include: { payments: { where: { deletedAt: null } } }
        })
        const totalPaid = Math.max(0, sumSuccessfulPayments(invoice.payments.map(p => ({
          status: p.status === 'PARTIALLY_REFUNDED' || p.status === 'REFUNDED' ? 'SUCCESS' : p.status,
          amount: p.id === payment.id
            ? Number(p.amount) - refundedAmount
            : Number(p.amount) - Number(p.refundedAmount)
        }))))
        const fullInvoiceRefund = totalPaid === 0 && Number(invoice.paidAmount) > 0
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: new Prisma.Decimal(totalPaid),
            status: fullInvoiceRefund ? 'REFUNDED' : (nextInvoiceStatus(invoice.totalAmount, totalPaid) as never)
          }
        })

        // Ledger: refund reverses a credit → debit entry.
        const lastEntry = await tx.ledgerEntry.findFirst({
          where: { orgId, studentId: invoice.studentId },
          orderBy: { createdAt: 'desc' },
          select: { balance: true }
        })
        await tx.ledgerEntry.create({
          data: {
            orgId,
            studentId: invoice.studentId,
            invoiceId: invoice.id,
            paymentId: payment.id,
            type: 'REFUND',
            debit: amount,
            balance: new Prisma.Decimal((lastEntry ? Number(lastEntry.balance) : 0) + Number(amount)),
            description: `Refund against ${payment.receiptNumber}`
          }
        })
      })
      return { applied: true }
    }

    default:
      return { applied: false, reason: `unhandled event ${event.rawType}` }
  }
}

async function notifyPaymentReceived(orgId: string, invoiceId: string, amount: number): Promise<void> {
  try {
    const [{ createNotification }, invoice, orgAdmin] = await Promise.all([
      import('@/lib/services/notifications'),
      prisma.invoice.findFirst({ where: { id: invoiceId }, include: { student: { select: { name: true } } } }),
      prisma.user.findFirst({
        where: {
          orgId,
          roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } },
          status: 'ACTIVE',
          deletedAt: null
        },
        select: { id: true }
      })
    ])
    if (!orgAdmin || !invoice) return
    await createNotification({
      orgId,
      recipientType: 'USER',
      recipientId: orgAdmin.id,
      type: 'FEE_PAYMENT_RECEIVED',
      title: 'Online payment received',
      body: `₹${amount.toLocaleString('en-IN')} received for ${invoice.student?.name ?? 'student'} (${invoice.invoiceNumber})`,
      data: { invoiceId, href: '/fee-management' }
    })
  } catch (error) {
    console.error('[webhook] notification failed:', error)
  }
}
