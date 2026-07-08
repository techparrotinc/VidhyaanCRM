import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { forOrg } from '@/lib/db/tenant'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { getReport, REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { REPORT_QUERIES } from '@/lib/reports/queries'
import { branchIdsFor } from '@/lib/reports/queries/scope'
import type { Filters, ReportCtx } from '@/lib/reports/queries/types'
import {
  cadenceDueToday, nowInIst, renderScheduleEmail, CADENCE_LABELS, CadenceToken
} from '@/lib/reports/schedule'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Daily delivery window (Vercel cron 02:30 UTC = 08:00 IST). Each schedule
// runs with its CREATOR's role scoping — a counsellor's scheduled funnel
// stays scoped to their own leads, exactly like the interactive report.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ist = nowInIst()
  const schedules = await prisma.reportSchedule.findMany({
    where: { enabled: true, channel: 'email' }
  })
  const due = schedules.filter(s => cadenceDueToday(s.cadence, ist))

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.vidhyaan.com'
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const schedule of due) {
    try {
      const report = getReport(schedule.reportKey)
      if (!report) { skipped++; continue }

      // Fail closed on every guard the interactive route would apply.
      const [org, moduleAccess, assignment] = await Promise.all([
        prisma.organization.findFirst({
          where: { id: schedule.orgId, deletedAt: null, status: { notIn: ['SUSPENDED'] } },
          select: { id: true, name: true }
        }),
        prisma.organizationModule.findFirst({
          where: {
            orgId: schedule.orgId,
            enabled: true,
            module: { slug: REPORTS_MODULE_SLUG }
          }
        }),
        prisma.userRoleAssignment.findFirst({
          where: { userId: schedule.userId, orgId: schedule.orgId, status: 'ACTIVE' },
          orderBy: { isDefault: 'desc' }
        })
      ])
      if (!org || !moduleAccess || !assignment ||
          !report.allowedRoles.includes(assignment.role as string)) {
        skipped++
        continue
      }

      let filters: Filters = {}
      if (schedule.savedViewId) {
        const view = await prisma.reportSavedView.findFirst({
          where: { id: schedule.savedViewId, userId: schedule.userId, orgId: schedule.orgId }
        })
        if (view?.filters && typeof view.filters === 'object') {
          filters = view.filters as Filters
        }
      }

      const ctx: ReportCtx = {
        db: forOrg(schedule.orgId),
        orgId: schedule.orgId,
        userId: schedule.userId,
        role: assignment.role as string,
        branchIds: await branchIdsFor(schedule.userId, assignment.role as string),
        academicYearId: undefined // active year resolves via legacy-null scope
      }

      const query = REPORT_QUERIES[schedule.reportKey]
      const [summary, rows] = await Promise.all([
        query.summary(ctx, filters),
        query.rows(ctx, filters, undefined, 15)
      ])

      const email = renderScheduleEmail({
        orgName: org.name,
        reportTitle: report.title,
        cadenceLabel: CADENCE_LABELS[schedule.cadence as CadenceToken] ?? schedule.cadence,
        insight: summary.insight,
        kpis: summary.kpis,
        columns: rows.columns,
        rows: rows.rows,
        reportUrl: `${base}/reports/r/${schedule.reportKey}`
      })

      const recipients = Array.isArray(schedule.recipients)
        ? (schedule.recipients as string[]).slice(0, 5)
        : []
      for (const to of recipients) {
        await sendTransactionalEmail({
          to,
          subject: email.subject,
          htmlBody: email.html,
          textBody: email.text
        })
        sent++
      }
    } catch (err) {
      if (errors.length < 10) {
        errors.push(`${schedule.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  return NextResponse.json({ due: due.length, sent, skipped, errors })
}
