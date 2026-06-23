import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { InvoiceStatus } from '@prisma/client'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)
    const status = searchParams.get('status') ?? undefined
    const studentId = searchParams.get('studentId') ?? undefined

    const skip = (page - 1) * limit
    const where: any = {}
    if (status) where.status = status as InvoiceStatus
    if (studentId) where.studentId = studentId

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentCode: true,
              gradeLabel: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true
            }
          }
        }
      }),
      db.invoice.count({ where })
    ])

    return paginated(invoices, total, page, limit)
  }
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const body = z.object({
      studentId: z.string(),
      description: z.string().min(1),
      totalAmount: z.number().min(0),
      dueDate: z.string(),
      feePlanId: z.string().optional(),
      academicYearId: z.string().optional()
    }).parse(await req.json())

    const year = new Date().getFullYear()
    const count = await prisma.invoice.count({
      where: { orgId: user.orgId }
    })

    const invoiceNumber = 'INV-' + year + '-' + String(count + 1).padStart(5, '0')

    const invoice = await db.invoice.create({
      data: {
        orgId: user.orgId,
        invoiceNumber,
        studentId: body.studentId,
        totalAmount: body.totalAmount,
        notes: body.description,
        status: 'UNPAID' as InvoiceStatus,
        dueDate: new Date(body.dueDate),
        academicYearId: body.academicYearId ?? academicYearId ?? null
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true
          }
        }
      }
    })

    return created(invoice)
  }
})
