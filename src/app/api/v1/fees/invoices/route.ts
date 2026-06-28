import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'

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

const createInvoiceItemSchema = z.object({
  head: z.string().min(1),
  amount: z.number().min(0),
  quantity: z.number().min(1).default(1)
})

const batchInvoiceItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0)
})

const createInvoiceSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('single').default('single'),
    studentId: z.string().min(1),
    invoiceType: z.enum(['TERM', 'ADHOC', 'COURSE']).default('ADHOC'),
    termId: z.string().optional().nullable(),
    courseId: z.string().optional().nullable(),
    feePlanId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    scheduledDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(createInvoiceItemSchema).min(1)
  }),
  z.object({
    mode: z.literal('batch'),
    batchId: z.string().min(1),
    invoices: z.array(
      z.object({
        studentId: z.string().min(1),
        invoiceType: z.enum(['TERM', 'ADHOC', 'COURSE']).default('TERM'),
        termId: z.string().optional().nullable(),
        courseId: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        scheduledDate: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        items: z.array(batchInvoiceItemSchema).min(1)
      })
    ).min(1)
  })
])

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const rawBody = await req.json()
    if (!rawBody.mode) {
      rawBody.mode = 'single'
    }

    const body = createInvoiceSchema.parse(rawBody)

    if (body.mode === 'batch') {
      const year = new Date().getFullYear()

      const result = await prisma.$transaction(async (tx) => {
        const initialCount = await tx.invoice.count({
          where: { orgId: user.orgId }
        })

        const invoicesList = []

        for (let i = 0; i < body.invoices.length; i++) {
          const inv = body.invoices[i]
          const invoiceNumber =
            'INV-' + year + '-' + String(initialCount + 1 + i).padStart(5, '0')

          // Calculate total from items
          const totalAmount = inv.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          )

          let status: 'SCHEDULED' | 'UNPAID' = 'UNPAID'
          let scheduledDateVal: Date | null = null

          if (inv.scheduledDate) {
            const parsedDate = new Date(inv.scheduledDate)
            if (!isNaN(parsedDate.getTime())) {
              scheduledDateVal = parsedDate
              if (parsedDate > new Date()) {
                status = 'SCHEDULED'
              }
            }
          }

          const invoice = await tx.invoice.create({
            data: {
              orgId: user.orgId,
              invoiceNumber,
              studentId: inv.studentId,
              invoiceType: inv.invoiceType,
              termId: inv.termId ?? null,
              courseId: inv.courseId ?? null,
              academicYearId: academicYearId ?? null,
              totalAmount,
              paidAmount: 0,
              lateFeeAmount: 0,
              status,
              dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
              scheduledDate: scheduledDateVal,
              batchId: body.batchId,
              notes: inv.notes ?? null,
              items: {
                create: inv.items.map(item => ({
                  head: item.name,
                  amount: item.unitPrice,
                  quantity: item.quantity,
                  orgId: user.orgId
                }))
              }
            }
          })

          invoicesList.push({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            studentId: invoice.studentId,
            termId: invoice.termId,
            status: invoice.status,
            totalAmount: Number(invoice.totalAmount)
          })
        }

        return invoicesList
      })

      // Invalidate pipeline cache
      try {
        await redis.del(`pipeline:${user.orgId}`)
      } catch (err) {
        console.error('Failed to invalidate pipeline cache:', err)
      }

      return NextResponse.json({
        batchId: body.batchId,
        count: result.length,
        invoices: result
      }, { status: 201 })
    }

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

    let status: 'SCHEDULED' | 'UNPAID' = 'UNPAID'
    let scheduledDateVal: Date | null = null

    if (body.scheduledDate) {
      const parsedDate = new Date(body.scheduledDate)
      if (!isNaN(parsedDate.getTime())) {
        scheduledDateVal = parsedDate
        if (parsedDate > new Date()) {
          status = 'SCHEDULED'
        }
      }
    }

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
        status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        scheduledDate: scheduledDateVal,
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

    // Invalidate pipeline cache
    try {
      await redis.del(`pipeline:${user.orgId}`)
    } catch (err) {
      console.error('Failed to invalidate pipeline cache:', err)
    }

    return created(invoice)
  }
})
