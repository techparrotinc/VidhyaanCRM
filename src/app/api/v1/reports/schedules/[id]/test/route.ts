import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { deliverSchedule } from '@/lib/reports/deliver'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

// Send one immediate [TEST] email so the creator can verify deliverability
// without waiting for the daily window. Only the schedule's owner can trigger.
export const POST = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ user, db, params }) => {
    const schedule = await db.reportSchedule.findFirst({
      where: { id: params?.id, userId: user.id }
    })
    if (!schedule) throw Errors.notFound('Schedule')

    const result = await deliverSchedule(prisma, schedule, { test: true })
    if (result.status === 'error') {
      throw Errors.businessRule(`Test send failed: ${result.error}`)
    }
    if (result.status === 'skipped') {
      throw Errors.businessRule(`Test send skipped: ${result.reason}`)
    }
    return ok({ sent: result.sent })
  }
})
