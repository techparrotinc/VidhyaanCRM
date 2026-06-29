import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status') ?? undefined
    const termId = searchParams.get('termId') ?? undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined
    const month = searchParams.get('month') ?? undefined

    const where: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (status && status !== '') where.status = status
    if (termId && termId !== 'all') where.termId = termId
    if (courseId && courseId !== 'all') where.courseId = courseId
    if (gradeLabel && gradeLabel !== 'all') {
      where.student = { gradeLabel }
    }
    if (month) {
      where.createdAt = {
        gte: startOfMonth(parseISO(month + '-01')),
        lte: endOfMonth(parseISO(month + '-01'))
      }
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            studentCode: true,
            gradeLabel: true,
            guardianPhone: true
          }
        },
        term: {
          select: { name: true }
        }
      }
    })

    const headers = [
      'Invoice Number',
      'Student Name',
      'Student Code',
      'Grade',
      'Guardian Phone',
      'Term',
      'Invoice Type',
      'Total Amount',
      'Paid Amount',
      'Balance',
      'Status',
      'Due Date',
      'Created At'
    ]

    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.student?.name ?? '',
      inv.student?.studentCode ?? '',
      inv.student?.gradeLabel ?? '',
      inv.student?.guardianPhone ?? '',
      inv.term?.name ?? '',
      inv.invoiceType,
      inv.totalAmount.toString(),
      inv.paidAmount.toString(),
      (Number(inv.totalAmount) - Number(inv.paidAmount)).toString(),
      inv.status,
      inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : '',
      inv.createdAt.toISOString().split('T')[0]
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="invoices.csv"'
      }
    })
  }
})
