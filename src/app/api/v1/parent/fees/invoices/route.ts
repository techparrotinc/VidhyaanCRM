import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { sumSuccessfulPayments, remainingBalance } from '@/lib/fees'
import { getActiveGatewayConfig, isPayable } from '@/lib/payments/checkout'

/**
 * GET /api/v1/parent/fees/invoices
 * Invoices for all students linked to the signed-in parent, with balance and
 * the school's online-payment policy.
 */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Parent role required.' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: {
        id: true,
        orgId: true,
        name: true,
        gradeLabel: true,
        organization: { select: { name: true, institutionType: true } }
      }
    })
    if (students.length === 0) {
      return NextResponse.json({ success: true, data: { invoices: [] } })
    }

    const invoices = await prisma.invoice.findMany({
      where: { studentId: { in: students.map(s => s.id) }, deletedAt: null },
      include: {
        payments: { where: { deletedAt: null } },
        term: { select: { name: true } },
        course: { select: { name: true } },
        items: { select: { head: true, amount: true, quantity: true }, orderBy: { createdAt: 'asc' } }
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }]
    })

    // One gateway lookup per org (parents can have kids in several schools)
    const orgIds = [...new Set(students.map(s => s.orgId))]
    const configs = await Promise.all(orgIds.map(orgId => getActiveGatewayConfig(orgId)))
    const gatewayByOrg = new Map(orgIds.map((orgId, i) => [orgId, configs[i]]))

    const studentById = new Map(students.map(s => [s.id, s]))

    const data = invoices.map(invoice => {
      const student = studentById.get(invoice.studentId)!
      const paid = sumSuccessfulPayments(invoice.payments)
      const balance = remainingBalance(invoice.totalAmount, paid)
      const gateway = gatewayByOrg.get(invoice.orgId)
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        studentName: student.name,
        gradeLabel: student.gradeLabel,
        schoolName: student.organization.name,
        institutionType: student.organization.institutionType,
        invoiceType: invoice.invoiceType,
        termName: invoice.term?.name ?? null,
        courseName: invoice.course?.name ?? null,
        createdAt: invoice.createdAt,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: paid,
        balance,
        dueDate: invoice.dueDate,
        status: invoice.status,
        items: invoice.items.map(i => ({ head: i.head, amount: Number(i.amount), quantity: i.quantity })),
        payable: isPayable(invoice.status) && balance > 0 && !!gateway,
        allowPartial: gateway?.allowPartial ?? false,
        minPartialAmount: gateway?.minPartialAmount ? Number(gateway.minPartialAmount) : null
      }
    })

    return NextResponse.json({ success: true, data: { invoices: data } })
  } catch (error) {
    console.error('[parent/fees/invoices] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
