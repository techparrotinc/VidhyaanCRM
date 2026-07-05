import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors, AppError } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const CRM_EVENT_ROLES = [
  ROLES.ORG_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.COUNSELLOR,
  ROLES.RECEPTIONIST
]

const addRsvpSchema = z.object({
  attendeeType: z.enum(['USER', 'PARENT', 'LEAD']),
  attendeeId: z.string().max(50).optional().nullable(),
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING', 'ATTENDED']).optional()
})

const updateRsvpSchema = z.object({
  rsvpId: z.string().min(1).max(50),
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING', 'ATTENDED'])
})

async function findEventOr404(db: any, params: any) {
  const { id } = (await params) as { id?: string }
  if (!id) throw Errors.notFound('Event')
  const event = await db.event.findFirst({ where: { id } })
  if (!event) throw Errors.notFound('Event')
  return event
}

export const POST = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: CRM_EVENT_ROLES,
  handler: async ({ req, db, params }) => {
    const event = await findEventOr404(db, params)
    const body = addRsvpSchema.parse(await req.json())

    if (event.status !== 'PUBLISHED') {
      throw new AppError('BUSINESS_RULE', 'Publish the event before inviting attendees.', 409)
    }

    // attendeeId is a soft reference — verify it points at a real record the
    // org can see (Lead is tenant-scoped; User checked against orgId)
    if (body.attendeeId) {
      let exists = false
      if (body.attendeeType === 'LEAD') {
        exists = !!(await db.lead.findFirst({ where: { id: body.attendeeId }, select: { id: true } }))
      } else if (body.attendeeType === 'USER') {
        exists = !!(await db.user.findFirst({
          where: { id: body.attendeeId, orgId: event.orgId, deletedAt: null },
          select: { id: true }
        }))
      } else {
        exists = !!(await db.parent.findFirst({
          where: { id: body.attendeeId, deletedAt: null },
          select: { id: true }
        }))
      }
      if (!exists) throw Errors.notFound('Attendee')
    }

    if (body.attendeeId) {
      const duplicate = await db.eventRsvp.findFirst({
        where: {
          eventId: event.id,
          attendeeType: body.attendeeType,
          attendeeId: body.attendeeId
        }
      })
      if (duplicate) {
        throw new AppError('BUSINESS_RULE', 'Attendee already added to this event.', 409)
      }
    }

    if (event.capacity) {
      const goingCount = await db.eventRsvp.count({
        where: { eventId: event.id, status: { in: ['GOING', 'ATTENDED'] } }
      })
      if (goingCount >= event.capacity) {
        throw new AppError('BUSINESS_RULE', 'Event is at capacity.', 409)
      }
    }

    const rsvp = await db.eventRsvp.create({
      data: {
        orgId: event.orgId,
        eventId: event.id,
        attendeeType: body.attendeeType,
        attendeeId: body.attendeeId || null,
        status: body.status || 'GOING'
      }
    })

    return created(rsvp)
  }
})

export const PUT = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: CRM_EVENT_ROLES,
  handler: async ({ req, db, params }) => {
    const event = await findEventOr404(db, params)
    const body = updateRsvpSchema.parse(await req.json())

    const existing = await db.eventRsvp.findFirst({
      where: { id: body.rsvpId, eventId: event.id }
    })
    if (!existing) throw Errors.notFound('RSVP')

    const updated = await db.eventRsvp.update({
      where: { id: body.rsvpId },
      data: { status: body.status }
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, params }) => {
    const event = await findEventOr404(db, params)
    const rsvpId = new URL(req.url).searchParams.get('rsvpId')
    if (!rsvpId) throw Errors.validation({ rsvpId: ['rsvpId query param is required'] })

    const existing = await db.eventRsvp.findFirst({
      where: { id: rsvpId, eventId: event.id }
    })
    if (!existing) throw Errors.notFound('RSVP')

    await db.eventRsvp.delete({ where: { id: rsvpId } })

    return ok({ success: true })
  }
})
