import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '@prisma/client'
import { createNotification } from '@/lib/services/notifications'

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, params }) => {
    const body = z.object({
      amount: z.number().min(1),
      method: z.enum([
        'CASH', 'CHEQUE', 'DD',
        'NEFT_RTGS', 'ONLINE', 'UPI'
      ]),
      chequeNumber: z.string().optional(),
      bankName: z.string().optional(),
      ddNumber: z.string().optional(),
      neftRef: z.string().optional(),
      notes: z.string().optional()
    }).parse(await req.json())

    const invoice = await db.invoice.findFirst({
      where: { id: params?.id },
      include: { payments: true, student: true }
    })

    if (!invoice) {
      throw Errors.notFound('Invoice')
    }

    if (invoice.status === 'PAID') {
      throw Errors.businessRule('Invoice is already fully paid')
    }

    const totalPaid = invoice.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const remaining = Number(invoice.totalAmount) - totalPaid

    if (body.amount > remaining) {
      throw Errors.businessRule(
        'Payment amount exceeds remaining balance of ₹' + remaining
      )
    }

    // Generate temp receipt number
    const count = await prisma.payment.count({
      where: { orgId: user.orgId }
    })
    const tempReceiptNo = 'RCP-' + new Date().getFullYear() + '-' + String(count + 1).padStart(5, '0')

    const mapPaymentMethod = (method: string): PaymentMethod => {
      switch (method) {
        case 'CASH': return 'CASH'
        case 'CHEQUE': return 'CHEQUE'
        case 'DD': return 'DD'
        case 'NEFT_RTGS': return 'NEFT'
        case 'ONLINE': return 'BANK_TRANSFER'
        case 'UPI': return 'UPI'
        default: return 'OTHER'
      }
    }

    const payment = await db.payment.create({
      data: {
        orgId: user.orgId,
        receiptNumber: tempReceiptNo,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount: body.amount,
        method: mapPaymentMethod(body.method),
        status: 'SUCCESS' as PaymentStatus,
        paidAt: new Date(),
        instrumentNo: body.chequeNumber ?? body.ddNumber ?? null,
        bankName: body.bankName ?? null,
        utrNumber: body.neftRef ?? null,
        createdById: user.id
      }
    })

    const finalReceiptNumber = 'RCP-' +
      new Date().getFullYear() + '-' +
      String(payment.id.slice(-5).toUpperCase())

    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: { receiptNumber: finalReceiptNumber }
    })

    const newTotalPaid = totalPaid + body.amount
    const newStatus: InvoiceStatus =
      newTotalPaid >= Number(invoice.totalAmount)
      ? 'PAID'
      : newTotalPaid > 0
      ? 'PARTIALLY_PAID'
      : 'UNPAID'

    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        paidAmount: newTotalPaid
      }
    })

    // Create in-app notification for the ORG_ADMIN
    const orgAdmin = await db.user.findFirst({
      where: {
        orgId: user.orgId,
        roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } },
        status: 'ACTIVE'
      },
      select: { id: true }
    })

    if (orgAdmin) {
      try {
        const studentName = invoice.student ? invoice.student.name : 'Student'
        await createNotification({
          orgId: user.orgId,
          recipientType: 'USER',
          recipientId: orgAdmin.id,
          type: 'FEE_PAYMENT_RECEIVED',
          title: 'Payment Received',
          body: `₹${body.amount} received for ${studentName}`,
          data: {
            invoiceId: invoice.id,
            href: `/settings/billing`
          }
        })
      } catch (e) {
        console.error('Failed to trigger payment received notification:', e)
      }
    }

    return created({
      payment: updatedPayment,
      invoiceStatus: newStatus,
      receiptNumber: finalReceiptNumber,
      message: 'Payment of ₹' + body.amount + ' recorded. Invoice is now ' + newStatus
    })
  }
})
