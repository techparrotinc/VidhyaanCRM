import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { reportRequest, filtersEcho } from '@/lib/reports/route-helpers'
import { toCsv, toXlsx, drainRows } from '@/lib/reports/export'
import { renderReportPdf } from '@/lib/pdf/report-pdf'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

const CONTENT_TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf'
} as const

export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db, params }) => {
    const { report, query, ctx, filters } = await reportRequest({
      reportKey: params?.reportKey, url: req.url, db, user
    })

    const format = new URL(req.url).searchParams.get('format') ?? 'csv'
    if (!['csv', 'xlsx', 'pdf'].includes(format) ||
        !report.exports.includes(format as never)) {
      throw Errors.validation({ format: [`This report exports: ${report.exports.join(', ')}`] })
    }

    const { columns, rows, truncated } = await drainRows(cursor =>
      query.rows(ctx, filters, cursor, 500)
    )

    // Defaulter/phone-bearing exports carry guardian data — always audited.
    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: 'EXPORT',
        entityType: 'report',
        entityId: report.key,
        after: { format, rows: rows.length, truncated, filters: filters as object }
      }
    }).catch(err => console.error('Export audit log failed:', err))

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    // A truncated export is a partial answer — mark it in the filename and the
    // rendered meta line so the recipient can't mistake it for the whole set.
    const filename = `vidhyaan_${report.key.replace(/-/g, '_')}_${date}${truncated ? '_partial' : ''}.${format}`
    const echo = truncated
      ? `${filtersEcho(filters)} — TRUNCATED to first ${rows.length.toLocaleString('en-IN')} rows; narrow the filters for the full set`
      : filtersEcho(filters)

    let body: Buffer | string
    if (format === 'csv') {
      body = toCsv(columns, rows)
    } else if (format === 'xlsx') {
      body = await toXlsx(report.title, echo, columns, rows)
    } else {
      const org = await db.organization.findFirst({
        where: { id: user.orgId },
        select: { name: true }
      })
      const summary = await query.summary(ctx, filters)
      body = await renderReportPdf({
        title: report.title,
        orgName: org?.name ?? 'Vidhyaan',
        filtersEcho: echo,
        kpis: summary.kpis,
        columns,
        rows
      })
    }

    return new NextResponse(body as never, {
      headers: {
        'Content-Type': CONTENT_TYPES[format as keyof typeof CONTENT_TYPES],
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Report-Truncated': truncated ? 'true' : 'false',
        'X-Report-Row-Count': String(rows.length)
      }
    })
  }
})
