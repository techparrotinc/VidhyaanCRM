import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireStaffClaims } from '@/lib/mobile-auth/guard'

/**
 * Global search (wireframe s-search): one query across students, leads and
 * invoices — the front-desk "Nikhil who called?" box. Grouped results,
 * 5 per group; matches name / phone / guardian / code / invoice number.
 */

export async function GET(req: NextRequest) {
  const auth = await requireStaffClaims(req)
  if ('error' in auth) return auth.error
  const { orgId } = auth.claims

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json({ success: true, students: [], leads: [], invoices: [] })
  }
  const contains = { contains: q, mode: 'insensitive' as const }

  const [students, leads, invoices] = await Promise.all([
    prisma.student.findMany({
      where: {
        orgId,
        deletedAt: null,
        OR: [
          { name: contains },
          { studentCode: contains },
          { guardianName: contains },
          { guardianPhone: { contains: q } },
          { rollNumber: contains }
        ]
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, gradeLabel: true, section: true, guardianName: true, studentCode: true }
    }),
    prisma.lead.findMany({
      where: {
        orgId,
        deletedAt: null,
        OR: [
          { parentName: contains },
          { kidName: contains },
          { phone: { contains: q } },
          { leadCode: contains }
        ]
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, parentName: true, kidName: true, gradeSought: true, status: true, createdAt: true }
    }),
    prisma.invoice.findMany({
      where: {
        orgId,
        deletedAt: null,
        OR: [{ invoiceNumber: contains }, { student: { name: contains } }]
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        student: { select: { id: true, name: true } }
      }
    })
  ])

  return NextResponse.json({
    success: true,
    students,
    leads,
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      studentId: i.student.id,
      studentName: i.student.name,
      balance: Number(i.totalAmount) - Number(i.paidAmount),
      status: i.status
    }))
  })
}
