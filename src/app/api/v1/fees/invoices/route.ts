import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.COUNSELLOR
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 25)
    const status = searchParams.get('status') ?? undefined
    const studentId = searchParams.get('studentId') ?? undefined
    const termId = searchParams.get('termId') ?? undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const invoiceType = searchParams.get('invoiceType') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined

    const skip = (page - 1) * limit

    const where: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (status) where.status = status
    if (studentId) where.studentId = studentId
    if (termId) where.termId = termId
    if (courseId) where.courseId = courseId
    if (invoiceType) where.invoiceType = invoiceType
    if (gradeLabel) {
      where.student = {
        gradeLabel
      }
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        {
          student: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

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
              gradeLabel: true,
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
              name: true
            }
          },
          items: true,
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
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

const createInvoiceSchema = z.object({
  studentId: z.string().min(1),
  invoiceType: z.enum(['TERM', 'ADHOC', 'COURSE']).default('ADHOC'),
  termId: z.string().optional(),
  courseId: z.string().optional(),
  feePlanId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      head: z.string().min(1),
      amount: z.number().min(0),
      quantity: z.number().min(1).default(1)
    })
  ).min(1)
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const body = createInvoiceSchema.parse(await req.json())

    // Generate invoice number scoped to the organization
    const year = new Date().getFullYear()
    const count = await db.invoice.count({
      where: { orgId: user.orgId }
    })
    const invoiceNumber =
      'INV-' + year + '-' + String(count + 1).padStart(5, '0')

    // Calculate total from items
    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0
    )

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        orgId: user.orgId,
        invoiceNumber,
        studentId: body.studentId,
        invoiceType: body.invoiceType,
        termId: body.termId ?? null,
        courseId: body.courseId ?? null,
        academicYearId: academicYearId ?? null,
        totalAmount,
        paidAmount: 0,
        lateFeeAmount: 0,
        status: 'UNPAID',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes ?? null,
        items: {
          create: body.items.map(item => ({
            head: item.head,
            amount: item.amount,
            quantity: item.quantity,
            orgId: user.orgId
          }))
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            gradeLabel: true
          }
        },
        items: true
      }
    })

    return created(invoice)
  }
})
