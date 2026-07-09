import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Full data export for an organization as a multi-sheet Excel workbook.
// Purpose: hand a cancelling/off-boarding customer a portable copy of their
// data (leads, admissions, students, invoices, payments, team).
// SUPER_ADMIN / OPERATIONS_ADMIN only.

type ColumnDef = { header: string; key: string; width?: number; money?: boolean; date?: boolean }

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: ColumnDef[],
  rows: Record<string, any>[]
) {
  const ws = wb.addWorksheet(name)
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }))
  ws.getRow(1).font = { bold: true }
  for (const row of rows) {
    const out: Record<string, any> = {}
    for (const c of columns) {
      let v = row[c.key]
      if (v === null || v === undefined) v = ''
      else if (c.money) v = Number(v)
      else if (c.date && v instanceof Date) v = v.toISOString().slice(0, 10)
      else if (typeof v === 'object' && v?.toNumber) v = v.toNumber()
      out[c.key] = v
    }
    ws.addRow(out)
  }
  return ws
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, email: true, phone: true, institutionType: true, status: true, createdAt: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const where = { orgId: id, deletedAt: null }
    const [leads, admissions, students, invoices, payments, users] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.admission.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.student.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.user.findMany({ where, select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true } }),
    ])

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Vidhyaan Platform'
    wb.created = new Date()

    // Summary sheet
    const summary = wb.addWorksheet('Summary')
    summary.columns = [{ header: 'Field', key: 'k', width: 26 }, { header: 'Value', key: 'v', width: 44 }]
    summary.getRow(1).font = { bold: true }
    ;[
      ['Organization', org.name],
      ['Slug', org.slug],
      ['Type', org.institutionType],
      ['Status', org.status],
      ['Email', org.email],
      ['Phone', org.phone],
      ['Joined', org.createdAt.toISOString().slice(0, 10)],
      ['Exported At', new Date().toISOString()],
      ['Leads', leads.length],
      ['Admissions', admissions.length],
      ['Students', students.length],
      ['Invoices', invoices.length],
      ['Payments', payments.length],
      ['Team Members', users.length],
    ].forEach(([k, v]) => summary.addRow({ k, v }))

    addSheet(wb, 'Leads', [
      { header: 'Lead Code', key: 'leadCode' },
      { header: 'Parent Name', key: 'parentName' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Child Name', key: 'kidName' },
      { header: 'Grade Sought', key: 'gradeSought' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt', date: true },
    ], leads)

    addSheet(wb, 'Admissions', [
      { header: 'Admission Code', key: 'admissionCode' },
      { header: 'Applicant Name', key: 'applicantName' },
      { header: 'Parent Name', key: 'parentName' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Grade Sought', key: 'gradeSought' },
      { header: 'Created', key: 'createdAt', date: true },
    ], admissions)

    addSheet(wb, 'Students', [
      { header: 'Student Code', key: 'studentCode' },
      { header: 'Name', key: 'name' },
      { header: 'Grade', key: 'gradeLabel' },
      { header: 'Section', key: 'section' },
      { header: 'Guardian', key: 'guardianName' },
      { header: 'Guardian Phone', key: 'guardianPhone' },
      { header: 'Guardian Email', key: 'guardianEmail' },
      { header: 'Created', key: 'createdAt', date: true },
    ], students)

    addSheet(wb, 'Invoices', [
      { header: 'Invoice #', key: 'invoiceNumber' },
      { header: 'Total', key: 'totalAmount', money: true },
      { header: 'Paid', key: 'paidAmount', money: true },
      { header: 'Late Fee', key: 'lateFeeAmount', money: true },
      { header: 'Due Date', key: 'dueDate', date: true },
      { header: 'Created', key: 'createdAt', date: true },
    ], invoices)

    addSheet(wb, 'Payments', [
      { header: 'Receipt #', key: 'receiptNumber' },
      { header: 'Amount', key: 'amount', money: true },
      { header: 'Refunded', key: 'refundedAmount', money: true },
      { header: 'Created', key: 'createdAt', date: true },
    ], payments)

    addSheet(wb, 'Team', [
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Status', key: 'status' },
      { header: 'Created', key: 'createdAt', date: true },
    ], users)

    const buffer = await wb.xlsx.writeBuffer()
    const safeName = (org.slug || org.name || 'organization').replace(/[^a-z0-9-_]/gi, '_')
    const filename = `vidhyaan_${safeName}_export_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Org data export error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
