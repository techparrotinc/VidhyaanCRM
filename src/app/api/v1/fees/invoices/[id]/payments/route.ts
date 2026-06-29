import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

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

    const invoice = await db.invoice.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!invoice) {
      throw Errors.notFound('Invoice')
    }

    // Generate receipt number scoped to the organization
    const year = new Date().getFullYear()
    const count = await db.payment.count({
      where: { orgId: user.orgId }
    })
    const receiptNumber =
      'RCP-' + year + '-' + String(count + 1).padStart(5, '0')

    // Create payment
    const payment = await db.payment.create({
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

    // Update invoice paidAmount and recalculate status
    const newPaidAmount = Number(invoice.paidAmount) + body.amount

    const newStatus =
      newPaidAmount >= Number(invoice.totalAmount)
        ? 'PAID'
        : newPaidAmount > 0
        ? 'PARTIALLY_PAID'
        : 'UNPAID'

    await db.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      }
    })

    return created({
      payment,
      invoiceStatus: newStatus,
      paidAmount: newPaidAmount,
      totalAmount: invoice.totalAmount
    })
  }
})
