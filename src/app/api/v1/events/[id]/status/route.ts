import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors, AppError } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { sendEventCancellationNotices } from '@/lib/services/eventEmails'
import { invalidateDashboardCache } from '@/lib/dashboard-cache'

// Lifecycle: DRAFT --publish--> PUBLISHED --cancel--> CANCELLED.
// Published events are locked (no edit, no delete) — cancel is the only exit.
export const PUT = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, params, user }) => {
    const { id } = (await params) as { id?: string }
    if (!id) throw Errors.notFound('Event')

    const { action } = z.object({ action: z.enum(['publish', 'cancel']) }).parse(await req.json())

    const event = await db.event.findFirst({ where: { id } })
    if (!event) throw Errors.notFound('Event')

    if (action === 'publish') {
      if (event.status !== 'DRAFT') {
        throw new AppError('BUSINESS_RULE', 'Only draft events can be published.', 409)
      }
      if (new Date(event.startsAt) < new Date()) {
        throw new AppError('BUSINESS_RULE', 'Cannot publish an event that starts in the past.', 409)
      }
      const updated = await db.event.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } })
      // Dashboard "Upcoming Events" card must reflect this immediately
      await invalidateDashboardCache(user.orgId)
      return ok(updated)
    }

    // cancel
    if (event.status !== 'PUBLISHED') {
      throw new AppError('BUSINESS_RULE', 'Only published events can be cancelled.', 409)
    }
    const updated = await db.event.update({ where: { id }, data: { status: 'CANCELLED' } })
    await invalidateDashboardCache(user.orgId)

    // Fire-and-forget: notify GOING/MAYBE attendees by email
    sendEventCancellationNotices(event)

    return ok(updated)
  }
})
