import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { onPaymentRecorded, formatInr, invoiceItemsLabel } from '@/lib/whatsapp/emitters'
import { sumSuccessfulPayments, remainingBalance, nextInvoiceStatus } from '@/lib/fees'
import { withReceiptNumber } from '@/lib/payments/receipts'
import { isPayable } from '@/lib/payments/checkout'

const paymentSchema = z.object({
  amount: z.number().min(1),
  method: z.enum([
    'CASH', 'UPI', 'CHEQUE', 'DD',
    'NEFT', 'BANK_TRANSFER',
    'RAZORPAY', 'CARD', 'OTHER'
  ]),
  instrumentNo: z.string().optional(),
  instrumentDate: z.string().optional(),
  bankName: z.string().optional(),
  utrNumber: z.string().optional(),
  paidAt: z.string().optional()
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Invoice')
    }

    const payments = await db.payment.findMany({
      where: {
        invoiceId: id,
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    })

    return ok(payments)
  }
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Invoice')
    }
    const body = paymentSchema.parse(await req.json())

    const { payment, invoice, newStatus, newPaidAmount } = await withReceiptNumber(user.orgId, (receiptNumber) =>
      db.$transaction(async (tx) => {
        // Balance check and payment create must see the same payment set:
        // two concurrent full-amount payments each read balance before either
        // commits and both settle (double-pay). The advisory xact lock
        // serializes the whole check-then-write section per invoice.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-pay:${id}`}))`

        const invoice = await tx.invoice.findFirst({
          where: { id, orgId: user.orgId, deletedAt: null },
          include: { payments: { where: { deletedAt: null } } }
        })
        if (!invoice) {
          throw Errors.notFound('Invoice')
        }
        if (!isPayable(invoice.status)) {
          throw Errors.businessRule(`Invoice is ${invoice.status.toLowerCase()} and cannot accept payments`)
        }

        const alreadyPaid = sumSuccessfulPayments(invoice.payments)
        const balance = remainingBalance(invoice.totalAmount, alreadyPaid)
        if (body.amount > balance) {
          throw Errors.businessRule(`Amount exceeds the remaining balance of ₹${balance}`)
        }

        const newPaidAmount = sumSuccessfulPayments([
          ...invoice.payments,
          { status: 'SUCCESS', amount: body.amount }
        ])
        const newStatus = nextInvoiceStatus(invoice.totalAmount, newPaidAmount)

        const created = await tx.payment.create({
          data: {
            receiptNumber,
            invoiceId: id,
            studentId: invoice.studentId,
            amount: body.amount,
            method: body.method,
            status: 'SUCCESS',
            instrumentNo: body.instrumentNo ?? null,
            instrumentDate: body.instrumentDate ? new Date(body.instrumentDate) : null,
            bankName: body.bankName ?? null,
            utrNumber: body.utrNumber ?? null,
            paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
            createdById: user.id,
            orgId: user.orgId
          }
        })

        await tx.invoice.update({
          where: { id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus
          }
        })

        const lastEntry = await tx.ledgerEntry.findFirst({
          where: { orgId: user.orgId, studentId: invoice.studentId },
          orderBy: { createdAt: 'desc' },
          select: { balance: true }
        })
        const ledgerBalance = (lastEntry ? Number(lastEntry.balance) : 0) - body.amount
        await tx.ledgerEntry.create({
          data: {
            orgId: user.orgId,
            studentId: invoice.studentId,
            invoiceId: id,
            paymentId: created.id,
            type: 'PAYMENT',
            credit: body.amount,
            balance: new Prisma.Decimal(ledgerBalance),
            description: `Payment ${receiptNumber} against ${invoice.invoiceNumber}`
          }
        })

        return { payment: created, invoice, newStatus, newPaidAmount }
      })
    )

    // WhatsApp payment confirmation to the guardian (fire-and-forget)
    prisma.student
      .findFirst({
        where: { id: invoice.studentId, orgId: user.orgId },
        select: { name: true, guardianName: true, guardianPhone: true }
      })
      .then(async (student) => {
        if (!student) return
        const items = await prisma.invoiceItem.findMany({
          where: { invoiceId: id },
          select: { head: true }
        })
        return onPaymentRecorded({
          orgId: user.orgId,
          paymentId: payment.id,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          studentName: student.name,
          plan: `${invoiceItemsLabel(items)} (${formatInr(body.amount)})`
        })
      })
      .catch(() => {})

    return created({
      payment,
      invoiceStatus: newStatus,
      paidAmount: newPaidAmount,
      totalAmount: invoice.totalAmount
    })
  }
})
