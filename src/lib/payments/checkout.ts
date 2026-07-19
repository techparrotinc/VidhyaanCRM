import { Prisma, GatewayOrderStatus, GatewayConfigStatus, InvoiceStatus, PaymentMethod, PaymentStatus, type GatewayOrder, type PaymentGatewayConfig } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sumSuccessfulPayments, remainingBalance, nextInvoiceStatus } from '@/lib/fees'
import { getProvider } from './registry'
import { decryptCredentials } from './config'
import { decryptSecret } from './vault'
import { toMinor } from './money'
import { withReceiptNumber } from './receipts'

/**
 * Checkout + payment settlement orchestration. Runs on the base prisma client
 * (parents and webhooks have no org session) — every query here MUST filter
 * by the orgId taken from the invoice/order row itself.
 */

export class CheckoutError extends Error {
  constructor(message: string, public status = 422) {
    super(message)
  }
}

const ORDER_TTL_MS = 6 * 60 * 60 * 1000 // extras past this are swept EXPIRED by cron

/** The org's currently active gateway config, or null. */
export async function getActiveGatewayConfig(orgId: string): Promise<PaymentGatewayConfig | null> {
  return prisma.paymentGatewayConfig.findFirst({
    where: {
      orgId,
      isCurrent: true,
      status: GatewayConfigStatus.ACTIVE,
      deletedAt: null
    }
  })
}

const PAYABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.UNPAID,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.OVERDUE
]

export function isPayable(status: InvoiceStatus): boolean {
  return PAYABLE_STATUSES.includes(status)
}

/**
 * Create a gateway order for one checkout intent. Amount is validated against
 * the live invoice balance and org policy, then fixed on the provider order.
 */
export async function createCheckout(input: {
  invoiceId: string
  orgId: string
  amount: number
  parentId?: string
}): Promise<{
  gatewayOrderId: string
  providerOrderId: string
  keyId: string
  amountMinor: number
  currency: string
  environment: string
}> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, orgId: input.orgId, deletedAt: null },
    include: { payments: { where: { deletedAt: null } } }
  })
  if (!invoice) throw new CheckoutError('Invoice not found', 404)
  if (!isPayable(invoice.status)) {
    throw new CheckoutError('This invoice is not payable')
  }

  const balance = remainingBalance(invoice.totalAmount, sumSuccessfulPayments(invoice.payments))
  if (balance <= 0) throw new CheckoutError('This invoice is already settled')
  if (input.amount > balance) {
    throw new CheckoutError(`Amount exceeds the remaining balance of ₹${balance}`)
  }

  const config = await getActiveGatewayConfig(input.orgId)
  if (!config) throw new CheckoutError('Online payments are not enabled for this school', 403)

  if (input.amount < balance) {
    if (!config.allowPartial) {
      throw new CheckoutError('This school does not accept partial payments')
    }
    const min = config.minPartialAmount ? Number(config.minPartialAmount) : 1
    if (input.amount < min) {
      throw new CheckoutError(`Minimum partial payment is ₹${min}`)
    }
  }

  const amountMinor = toMinor(input.amount)
  const provider = getProvider(config.provider)
  const creds = decryptCredentials(config)

  // Provider first, local row second: if the local write fails the provider
  // order is an orphan that simply expires unpaid — harmless. The reverse
  // (local row without provider order) would break checkout.
  const gatewayOrderId = crypto.randomUUID()
  const order = await provider.createOrder({
    amountMinor,
    currency: 'INR',
    receipt: gatewayOrderId,
    notes: {
      orgId: input.orgId,
      invoiceId: invoice.id,
      gatewayOrderId,
      studentId: invoice.studentId
    }
  }, creds)

  const row = await prisma.gatewayOrder.create({
    data: {
      id: gatewayOrderId,
      orgId: input.orgId,
      provider: config.provider,
      environment: config.environment,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      parentId: input.parentId,
      amount: new Prisma.Decimal(input.amount),
      currency: 'INR',
      providerOrderId: order.providerOrderId,
      expiresAt: new Date(Date.now() + ORDER_TTL_MS)
    }
  })

  return {
    gatewayOrderId: row.id,
    providerOrderId: order.providerOrderId,
    keyId: creds.keyId, // public identifier — safe for the browser
    amountMinor,
    currency: 'INR',
    environment: config.environment
  }
}

const METHOD_MAP: Record<string, PaymentMethod> = {
  upi: PaymentMethod.UPI,
  card: PaymentMethod.CARD,
  netbanking: PaymentMethod.BANK_TRANSFER,
  wallet: PaymentMethod.RAZORPAY,
  emi: PaymentMethod.RAZORPAY
}

/**
 * Idempotent settlement of a captured gateway payment. Called by the
 * checkout confirm endpoint (provisional, browser-reported) and by the
 * webhook processor (source of truth) — whichever lands first creates the
 * Payment; the other becomes a no-op.
 */
export async function applyGatewayPayment(input: {
  order: GatewayOrder
  providerPaymentId: string
  method?: string
}): Promise<{ paymentId: string; receiptNumber: string; duplicate: boolean }> {
  const { order } = input

  const existing = await prisma.payment.findFirst({
    where: { orgId: order.orgId, gatewayRef: input.providerPaymentId, deletedAt: null },
    select: { id: true, receiptNumber: true }
  })
  if (existing) {
    return { paymentId: existing.id, receiptNumber: existing.receiptNumber, duplicate: true }
  }

  const payment = await withReceiptNumber(order.orgId, (receiptNumber) =>
    prisma.$transaction(async (tx) => {
      // Same lock as the manual payment route: paidAmount is recomputed from
      // the payment set read here, so a manual payment settling concurrently
      // must not interleave or one side's total goes stale.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-pay:${order.invoiceId}`}))`

      const invoice = await tx.invoice.findFirstOrThrow({
        where: { id: order.invoiceId, orgId: order.orgId },
        include: { payments: { where: { deletedAt: null } } }
      })

      const created = await tx.payment.create({
        data: {
          orgId: order.orgId,
          branchId: invoice.branchId,
          academicYearId: invoice.academicYearId,
          receiptNumber,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: order.amount,
          method: METHOD_MAP[input.method ?? ''] ?? PaymentMethod.RAZORPAY,
          status: PaymentStatus.SUCCESS,
          gatewayRef: input.providerPaymentId,
          gatewayOrderId: order.id,
          paidAt: new Date()
        }
      })

      const totalPaid = sumSuccessfulPayments([
        ...invoice.payments,
        { status: 'SUCCESS', amount: order.amount }
      ])
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: new Prisma.Decimal(totalPaid),
          status: nextInvoiceStatus(invoice.totalAmount, totalPaid) as InvoiceStatus
        }
      })

      await tx.gatewayOrder.update({
        where: { id: order.id },
        data: {
          status: GatewayOrderStatus.PAID,
          providerPaymentId: input.providerPaymentId,
          paymentId: created.id
        }
      })

      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { orgId: order.orgId, studentId: invoice.studentId },
        orderBy: { createdAt: 'desc' },
        select: { balance: true }
      })
      const balance = (lastEntry ? Number(lastEntry.balance) : 0) - Number(order.amount)
      await tx.ledgerEntry.create({
        data: {
          orgId: order.orgId,
          studentId: invoice.studentId,
          invoiceId: invoice.id,
          paymentId: created.id,
          type: 'PAYMENT',
          credit: order.amount,
          balance: new Prisma.Decimal(balance),
          description: `Online payment ${receiptNumber} against ${invoice.invoiceNumber}`
        }
      })

      return created
    })
  )

  return { paymentId: payment.id, receiptNumber: payment.receiptNumber, duplicate: false }
}

/**
 * Browser-reported checkout success. Verifies the checkout signature with the
 * school's key secret, then settles provisionally (webhook remains the
 * authoritative confirmation).
 */
export async function confirmCheckout(input: {
  gatewayOrderId: string
  providerOrderId: string
  providerPaymentId: string
  signature: string
  parentId?: string
}): Promise<{ receiptNumber: string; duplicate: boolean }> {
  const order = await prisma.gatewayOrder.findFirst({
    where: { id: input.gatewayOrderId }
  })
  if (!order) throw new CheckoutError('Payment session not found', 404)
  if (input.parentId && order.parentId && order.parentId !== input.parentId) {
    throw new CheckoutError('Payment session not found', 404)
  }
  if (order.providerOrderId !== input.providerOrderId) {
    throw new CheckoutError('Order mismatch', 400)
  }

  const config = await prisma.paymentGatewayConfig.findFirst({
    where: {
      orgId: order.orgId,
      provider: order.provider,
      environment: order.environment,
      deletedAt: null
    }
  })
  if (!config) throw new CheckoutError('Gateway configuration missing', 409)

  const provider = getProvider(order.provider)
  const valid = provider.verifyCheckoutSignature({
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    signature: input.signature
  }, {
    keyId: decryptSecret(config.keyIdEncrypted),
    keySecret: decryptSecret(config.keySecretEncrypted)
  })
  if (!valid) throw new CheckoutError('Payment signature verification failed', 400)

  return applyGatewayPayment({
    order,
    providerPaymentId: input.providerPaymentId
  })
}
