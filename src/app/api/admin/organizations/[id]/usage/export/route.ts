import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/auth'
import { getOrgUsageDetail } from '@/lib/usage/aggregate'

// Excel usage report for an organization — for QBRs / customer-success reviews.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)
    const d = await getOrgUsageDetail(id, days)
    if (!d) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Vidhyaan Platform'
    wb.created = new Date()
    const s = d.summary
    const dateOf = (v: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : '—')

    // Summary
    const sum = wb.addWorksheet('Summary')
    sum.columns = [{ header: 'Metric', key: 'k', width: 32 }, { header: 'Value', key: 'v', width: 30 }]
    sum.getRow(1).font = { bold: true }
    ;[
      ['Organization', d.org.name],
      ['Period (days)', d.days],
      ['Health Score (%)', s.healthScore],
      ['— Module Adoption (%)', s.subScores.moduleAdoption],
      ['— Seat Utilization (%)', s.subScores.seatUtilization],
      ['— Recency (%)', s.subScores.recency],
      ['Total Active Hours', s.totalActiveHours],
      ['Active Users', `${s.activeUsers} / ${s.totalUsers}`],
      ['Active Days', `${s.activeDays} / ${d.days}`],
      ['Total Actions', s.totalActions],
      ['Hours Saved', s.hoursSaved],
      ['Cost Savings (INR)', s.costSavings],
      ['Modelled Hourly Rate (INR)', s.hourlyRate],
      ['Subscription Cost this period (INR)', s.periodSubscriptionCost],
      ['ROI (×)', s.roiMultiple ?? '—'],
      ['Modules Adopted', `${s.adoptedModules} / ${s.enabledModules}`],
    ].forEach(([k, v]) => sum.addRow({ k, v }))

    // Modules
    const mod = wb.addWorksheet('Modules')
    mod.columns = [
      { header: 'Module', key: 'label', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Actions', key: 'actions', width: 12 },
      { header: 'Active Users', key: 'activeUsers', width: 14 },
      { header: 'Active Hours', key: 'activeHours', width: 14 },
      { header: 'Hours Saved', key: 'hoursSaved', width: 14 },
      { header: 'Cost Savings (INR)', key: 'costSavings', width: 18 },
      { header: 'Last Active', key: 'lastActive', width: 14 },
    ]
    mod.getRow(1).font = { bold: true }
    d.modules.forEach((m) =>
      mod.addRow({
        label: m.label,
        status: m.underutilized ? 'Underused' : m.adopted ? 'Active' : m.licensable && !m.enabled ? 'Not licensed' : 'Idle',
        actions: m.actions, activeUsers: m.activeUsers, activeHours: m.activeHours,
        hoursSaved: m.hoursSaved, costSavings: m.costSavings, lastActive: dateOf(m.lastActive),
      })
    )

    // Users
    const usr = wb.addWorksheet('Users')
    usr.columns = [
      { header: 'User', key: 'name', width: 26 },
      { header: 'Active Hours', key: 'activeHours', width: 14 },
      { header: 'Actions', key: 'actions', width: 12 },
      { header: 'Top Module', key: 'topModule', width: 22 },
      { header: 'Last Active', key: 'lastActive', width: 14 },
    ]
    usr.getRow(1).font = { bold: true }
    d.users.forEach((u) =>
      usr.addRow({ name: u.name, activeHours: u.activeHours, actions: u.actions, topModule: u.topModule, lastActive: dateOf(u.lastActive) })
    )

    const buffer = await wb.xlsx.writeBuffer()
    const safe = (d.org.name || 'org').replace(/[^a-z0-9-_]/gi, '_')
    const filename = `vidhyaan_${safe}_usage_${d.days}d_${new Date().toISOString().slice(0, 10)}.xlsx`
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Org usage export error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
