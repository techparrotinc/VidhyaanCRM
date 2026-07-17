import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { sumSuccessfulPayments, remainingBalance, nextInvoiceStatus } from '@/lib/fees'

const concessionSchema = z.object({
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive(),
  reason: z.string().max(500).optional()
}).refine(
  b => b.type !== 'PERCENTAGE' || b.value <= 100,
  { message: 'Percentage cannot exceed 100', path: ['value'] }
)

// Invoice states a concession can't apply to — already settled or written off.
const NOT_CONCESSIONABLE = ['PAID', 'WAIVED', 'REFUNDED']

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
    const body = concessionSchema.parse(await req.json())

    const invoice = await db.invoice.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } }
    })
    if (!invoice) {
      throw Errors.notFound('Invoice')
    }
    if (NOT_CONCESSIONABLE.includes(invoice.status)) {
      throw Errors.businessRule(`Invoice is ${invoice.status.toLowerCase()} and cannot take a concession`)
    }

    const paid = sumSuccessfulPayments(invoice.payments)
    const balance = remainingBalance(invoice.totalAmount, paid)
    if (balance <= 0) {
      throw Errors.businessRule('Invoice has no outstanding balance to discount')
    }

    const rawDiscount = body.type === 'PERCENTAGE'
      ? (Number(invoice.totalAmount) * body.value) / 100
      : body.value
    // Cap at the remaining balance — a concession can't push totalAmount
    // below what's already been paid.
    const discount = Math.min(Math.round(rawDiscount * 100) / 100, balance)

    const newTotalAmount = Math.round((Number(invoice.totalAmount) - discount) * 100) / 100
    const newStatus = nextInvoiceStatus(newTotalAmount, paid)

    const [concession] = await db.$transaction([
      db.concession.create({
        data: {
          orgId: user.orgId,
          studentId: invoice.studentId,
          invoiceId: invoice.id,
          type: body.type,
          value: body.value,
          reason: body.reason ?? null,
          approvedById: user.id
        }
      }),
      db.invoice.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          status: newStatus
        }
      })
    ])

    return created({
      concession,
      discount,
      invoiceStatus: newStatus,
      totalAmount: newTotalAmount
    })
  }
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.COUNSELLOR
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Invoice')
    }

    const concessions = await db.concession.findMany({
      where: { invoiceId: id, orgId: user.orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })

    return ok(concessions)
  }
})
