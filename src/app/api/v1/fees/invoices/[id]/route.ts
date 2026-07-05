import { route } from '@/lib/api/compose'
import { z } from 'zod'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const updateInvoiceSchema = z.object({
  dueDate: z.string().max(40).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED', 'SCHEDULED']).optional()
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

    const invoice = await db.invoice.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            gradeLabel: true,
            guardianName: true,
            guardianPhone: true
          }
        },
        term: {
          select: {
            id: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            frequency: true
          }
        },
        items: true,
        payments: {
          where: {
            deletedAt: null
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        concessions: true
      }
    })

    if (!invoice) {
      throw Errors.notFound('Invoice')
    }

    return ok(invoice)
  }
})

export const PUT = route({
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
    const body = updateInvoiceSchema.parse(await req.json())

    const existing = await db.invoice.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Invoice')
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        status: body.status !== undefined ? body.status : undefined
      }
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user, params }) => {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) {
      throw Errors.notFound('Invoice')
    }

    const existing = await db.invoice.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!existing) {
      throw Errors.notFound('Invoice')
    }

    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return ok({ success: true })
  }
})
