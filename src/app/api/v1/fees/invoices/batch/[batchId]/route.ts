import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
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
  handler: async ({ db, user, params }) => {
    // Next.js 15: ALWAYS await params
    const resolvedParams = await params
    const batchId = resolvedParams?.batchId

    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing batchId parameter' },
        { status: 400 }
      )
    }

    const invoices = await db.invoice.findMany({
      where: {
        batchId,
        orgId: user.orgId,
        deletedAt: null
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            gradeLabel: true
          }
        },
        term: {
          select: {
            id: true,
            name: true,
            order: true
          }
        },
        course: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        {
          student: {
            name: 'asc'
          }
        },
        {
          term: {
            order: 'asc'
          }
        }
      ]
    })

    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      scheduledDate: invoice.scheduledDate,
      totalAmount: Number(invoice.totalAmount),
      dueDate: invoice.dueDate,
      student: {
        id: invoice.student.id,
        name: invoice.student.name,
        grade: invoice.student.gradeLabel
      },
      term: invoice.term ? {
        id: invoice.term.id,
        name: invoice.term.name
      } : null,
      course: invoice.course ? {
        id: invoice.course.id,
        name: invoice.course.name
      } : null
    }))

    return NextResponse.json({
      batchId,
      count: formattedInvoices.length,
      invoices: formattedInvoices
    })
  }
})
