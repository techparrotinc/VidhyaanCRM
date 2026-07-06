import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'

/**
 * GET /api/v1/parent/fees/payments
 * Successful payments (online and offline receipts) for the parent's linked
 * students, newest first.
 */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Parent role required.' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: { id: true, name: true }
    })
    if (students.length === 0) {
      return NextResponse.json({ success: true, data: { payments: [] } })
    }
    const studentNameById = new Map(students.map(s => [s.id, s.name]))

    const payments = await prisma.payment.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        status: { in: ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
        deletedAt: null
      },
      include: { invoice: { select: { invoiceNumber: true } } },
      orderBy: { paidAt: 'desc' },
      take: 100
    })

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          id: p.id,
          receiptNumber: p.receiptNumber,
          invoiceNumber: p.invoice.invoiceNumber,
          studentName: p.studentId ? studentNameById.get(p.studentId) ?? null : null,
          amount: Number(p.amount),
          refundedAmount: Number(p.refundedAmount),
          method: p.method,
          status: p.status,
          paidAt: p.paidAt
        }))
      }
    })
  } catch (error) {
    console.error('[parent/fees/payments] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
