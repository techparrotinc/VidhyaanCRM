import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireStaffClaims } from '@/lib/mobile-auth/guard'
import { ROLES } from '@/constants/roles'

/**
 * Staff Fees tab BFF (wireframe s-defaulters): Collected-today + Open-dues
 * KPIs plus every open invoice — overdue first, then upcoming dues, so a
 * freshly created enrolment invoice (due on the next billing day) is
 * collectable immediately instead of hiding until it turns overdue.
 */

const MONEY_ROLES: string[] = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST]

export async function GET(req: NextRequest) {
  const auth = await requireStaffClaims(req)
  if ('error' in auth) return auth.error
  const { orgId, role } = auth.claims
  if (!MONEY_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const now = new Date()

  const [collectedToday, open] = await Promise.all([
    prisma.payment.aggregate({
      where: { orgId, status: 'SUCCESS', deletedAt: null, paidAt: { gte: today } },
      _sum: { amount: true }
    }),
    prisma.invoice.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] }
      },
      orderBy: { dueDate: 'asc' },
      take: 200,
      include: {
        student: {
          select: { id: true, name: true, studentCode: true, gradeLabel: true, section: true, guardianPhone: true }
        }
      }
    })
  ])

  const invoices = open.map((inv) => {
    const balance = Number(inv.totalAmount) - Number(inv.paidAmount)
    const daysOverdue = inv.dueDate
      ? Math.floor((now.getTime() - inv.dueDate.getTime()) / 86_400_000)
      : 0
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      balance,
      dueDate: inv.dueDate,
      daysOverdue, // negative = due in N days
      status: inv.status,
      student: inv.student
    }
  })

  // Overdue first (most overdue on top), then upcoming dues (soonest first).
  invoices.sort((a, b) => {
    const aOver = a.daysOverdue > 0
    const bOver = b.daysOverdue > 0
    if (aOver !== bOver) return aOver ? -1 : 1
    return aOver ? b.daysOverdue - a.daysOverdue : a.daysOverdue - b.daysOverdue
  })

  const openDues = invoices.reduce((sum, i) => sum + i.balance, 0)

  return NextResponse.json({
    success: true,
    kpis: {
      collectedToday: Number(collectedToday._sum.amount ?? 0),
      openDues
    },
    invoices
  })
}
