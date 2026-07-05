import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created, paginated } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { InvoiceStatus, InvoiceType } from '@prisma/client'
import { asEnum } from '@/lib/api/query'
import { sumLineItems, resolveScheduleStatus } from '@/lib/fees'

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

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25') || 25))
    const status = searchParams.get('status') ?? undefined
    const studentId = searchParams.get('studentId') ?? undefined
    const termId = searchParams.get('termId') ?? undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const invoiceType = searchParams.get('invoiceType') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined
    const month = searchParams.get('month') ?? undefined

    const skip = (page - 1) * limit

    const baseWhere: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (studentId) baseWhere.studentId = studentId
    if (termId && termId !== 'all') baseWhere.termId = termId
    if (courseId && courseId !== 'all') baseWhere.courseId = courseId
    if (invoiceType) baseWhere.invoiceType = asEnum(InvoiceType, invoiceType, 'invoiceType')
    if (gradeLabel && gradeLabel !== 'all') {
      baseWhere.student = {
        gradeLabel
      }
    }
    if (month) {
      baseWhere.createdAt = {
        gte: startOfMonth(parseISO(month + '-01')),
        lte: endOfMonth(parseISO(month + '-01'))
      }
    }
    if (search) {
      baseWhere.OR = [
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

    const where = { ...baseWhere }
    if (status && status !== '') where.status = asEnum(InvoiceStatus, status, 'status')

    const [invoices, total, statusCountsRaw] = await Promise.all([
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
          }
          // items + payments intentionally omitted from the list query — the
          // list renders invoice scalars (paidAmount/status/totalAmount) only;
          // the detail page fetches line items and payments on demand.
        }
      }),
      db.invoice.count({ where }),
      db.invoice.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true }
      })
    ])

    const statusCounts: Record<string, number> = {
      ALL: 0,
      SCHEDULED: 0,
      UNPAID: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      OVERDUE: 0,
      WAIVED: 0
    }

    let allCount = 0
    statusCountsRaw.forEach((item: any) => {
      const cnt = item._count.id
      statusCounts[item.status] = cnt
      allCount += cnt
    })
    statusCounts.ALL = allCount

    return NextResponse.json({
      success: true,
      data: invoices,
      total,
      totalPages: Math.ceil(total / limit),
      statusCounts
    })
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

          const totalAmount = sumLineItems(
            inv.items.map(item => ({ price: item.unitPrice, quantity: item.quantity }))
          )
          const { status, scheduledDate: scheduledDateVal } = resolveScheduleStatus(inv.scheduledDate)

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

    const totalAmount = sumLineItems(
      body.items.map(item => ({ price: item.amount, quantity: item.quantity }))
    )
    const { status, scheduledDate: scheduledDateVal } = resolveScheduleStatus(body.scheduledDate)

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
