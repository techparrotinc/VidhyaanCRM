import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

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
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined

    const where: any = {
      orgId: user.orgId,
      deletedAt: null
    }
    if (status) where.status = status
    if (termId) where.termId = termId
    if (gradeLabel) {
      where.student = { gradeLabel }
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
