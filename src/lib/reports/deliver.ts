import type { PrismaClient, ReportSchedule } from '@prisma/client'
import { forOrg } from '@/lib/db/tenant'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { getReport, REPORTS_MODULE_SLUG } from './registry'
import { REPORT_QUERIES } from './queries'
import { branchIdsFor } from './queries/scope'
import type { Filters, ReportCtx } from './queries/types'
import { renderScheduleEmail, CADENCE_LABELS, CadenceToken } from './schedule'

export type DeliveryResult =
  | { status: 'sent'; sent: number }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; error: string }

/**
 * Deliver one scheduled report by email. Re-runs every guard the interactive
 * route applies (org active, module enabled, creator's role still valid) and
 * runs the query with the CREATOR's row scoping — a counsellor's scheduled
 * report stays scoped to their own leads. Shared by the cron and the
 * "send test" endpoint; never throws.
 *
 * `test` prefixes the subject with [TEST] and does not persist run status.
 */
export async function deliverSchedule(
  prisma: PrismaClient,
  schedule: ReportSchedule,
  opts: { test?: boolean } = {}
): Promise<DeliveryResult> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.vidhyaan.com'
  const persist = (result: DeliveryResult) =>
    opts.test
      ? Promise.resolve()
      : prisma.reportSchedule
          .update({
            where: { id: schedule.id },
            data: {
              lastRunAt: new Date(),
              lastStatus: result.status,
              lastError: result.status === 'error' ? result.error : null
            }
          })
          .catch(() => {})

  try {
    const report = getReport(schedule.reportKey)
    if (!report) {
      const r: DeliveryResult = { status: 'skipped', reason: 'unknown report' }
      await persist(r)
      return r
    }

    const [org, moduleAccess, assignment] = await Promise.all([
      prisma.organization.findFirst({
        where: { id: schedule.orgId, deletedAt: null, status: { notIn: ['SUSPENDED'] } },
        select: { id: true, name: true }
      }),
      prisma.organizationModule.findFirst({
        where: { orgId: schedule.orgId, enabled: true, module: { slug: REPORTS_MODULE_SLUG } }
      }),
      prisma.userRoleAssignment.findFirst({
        where: { userId: schedule.userId, orgId: schedule.orgId, status: 'ACTIVE' },
        orderBy: { isDefault: 'desc' }
      })
    ])
    if (!org || !moduleAccess || !assignment ||
        !report.allowedRoles.includes(assignment.role as string)) {
      const r: DeliveryResult = { status: 'skipped', reason: 'access revoked' }
      await persist(r)
      return r
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
      academicYearId: undefined
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
    let sent = 0
    for (const to of recipients) {
      await sendTransactionalEmail({
        to,
        subject: opts.test ? `[TEST] ${email.subject}` : email.subject,
        htmlBody: email.html,
        textBody: email.text
      })
      sent++
    }

    const r: DeliveryResult = { status: 'sent', sent }
    await persist(r)
    return r
  } catch (err) {
    const r: DeliveryResult = {
      status: 'error',
      error: err instanceof Error ? err.message : String(err)
    }
    await persist(r)
    return r
  }
}
