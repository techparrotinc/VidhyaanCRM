import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors, AppError } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { EVENT_TYPES } from '@/constants/events'

const updateEventSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(EVENT_TYPES).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  startsAt: z.string().max(40).optional(),
  endsAt: z.string().max(40).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  meetingLink: z.string().max(1000).optional().nullable(),
  academicYearId: z.string().max(50).optional().nullable(),
  branchId: z.string().max(50).optional().nullable()
})

export const GET = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST],
  handler: async ({ db, params }) => {
    const { id } = (await params) as { id?: string }
    if (!id) throw Errors.notFound('Event')

    const event = await db.event.findFirst({
      where: { id },
      include: {
        rsvps: { orderBy: { createdAt: 'desc' } },
        academicYear: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      }
    })
    if (!event) throw Errors.notFound('Event')

    const counts = { going: 0, maybe: 0, notGoing: 0, attended: 0 }
    for (const r of event.rsvps) {
      if (r.status === 'GOING') counts.going++
      else if (r.status === 'MAYBE') counts.maybe++
      else if (r.status === 'NOT_GOING') counts.notGoing++
      else if (r.status === 'ATTENDED') counts.attended++
    }

    // attendeeId is a soft reference — resolve display names per type
    const idsByType: Record<string, string[]> = { USER: [], PARENT: [], LEAD: [] }
    for (const r of event.rsvps) {
      if (r.attendeeId && idsByType[r.attendeeType]) idsByType[r.attendeeType].push(r.attendeeId)
    }
    const [users, parents, leads] = await Promise.all([
      idsByType.USER.length
        ? db.user.findMany({ where: { id: { in: idsByType.USER } }, select: { id: true, name: true, phone: true } })
        : [],
      idsByType.PARENT.length
        ? db.parent.findMany({ where: { id: { in: idsByType.PARENT } }, select: { id: true, name: true, phone: true } })
        : [],
      idsByType.LEAD.length
        ? db.lead.findMany({ where: { id: { in: idsByType.LEAD } }, select: { id: true, parentName: true, phone: true, leadCode: true } })
        : []
    ])
    const nameMap = new Map<string, { name: string; phone?: string | null; leadCode?: string }>()
    users.forEach((u: any) => nameMap.set(`USER:${u.id}`, { name: u.name, phone: u.phone }))
    parents.forEach((p: any) => nameMap.set(`PARENT:${p.id}`, { name: p.name, phone: p.phone }))
    leads.forEach((l: any) => nameMap.set(`LEAD:${l.id}`, { name: l.parentName, phone: l.phone, leadCode: l.leadCode }))

    const rsvpsWithNames = event.rsvps.map((r) => ({
      ...r,
      attendee: r.attendeeId
        ? nameMap.get(`${r.attendeeType}:${r.attendeeId}`) ?? { name: 'Unknown' }
        : { name: 'Guest' }
    }))

    return ok({ ...event, rsvps: rsvpsWithNames, rsvpCounts: counts })
  }
})

export const PUT = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, params }) => {
    const { id } = (await params) as { id?: string }
    if (!id) throw Errors.notFound('Event')

    const body = updateEventSchema.parse(await req.json())

    const existing = await db.event.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Event')

    if (existing.status !== 'DRAFT') {
      throw new AppError('BUSINESS_RULE', 'Published events cannot be edited. Cancel the event instead.', 409)
    }

    const startsAt = body.startsAt ? new Date(body.startsAt) : undefined
    if (startsAt && isNaN(startsAt.getTime())) {
      throw Errors.validation({ startsAt: ['Invalid date'] })
    }
    // endsAt: undefined = untouched, null = cleared, string = new value
    let endsAt: Date | null | undefined = undefined
    if (body.endsAt === null) endsAt = null
    else if (body.endsAt !== undefined) {
      endsAt = new Date(body.endsAt)
      if (isNaN(endsAt.getTime())) {
        throw Errors.validation({ endsAt: ['Invalid date'] })
      }
    }
    const effectiveStart = startsAt ?? existing.startsAt
    const effectiveEnd = endsAt === undefined ? existing.endsAt : endsAt
    if (effectiveEnd && effectiveEnd < effectiveStart) {
      throw Errors.validation({ endsAt: ['Must be after startsAt'] })
    }

    const updateData: any = {
      title: body.title,
      description: body.description,
      type: body.type ?? undefined,
      capacity: body.capacity,
      startsAt,
      endsAt,
      location: body.location,
      meetingLink: body.meetingLink
    }

    if (body.academicYearId !== undefined) {
      updateData.academicYear = body.academicYearId
        ? { connect: { id: body.academicYearId } }
        : { disconnect: true }
    }

    if (body.branchId !== undefined) {
      updateData.branch = body.branchId
        ? { connect: { id: body.branchId } }
        : { disconnect: true }
    }

    const updated = await db.event.update({
      where: { id },
      data: updateData
    })

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, params }) => {
    const { id } = (await params) as { id?: string }
    if (!id) throw Errors.notFound('Event')

    const existing = await db.event.findFirst({ where: { id } })
    if (!existing) throw Errors.notFound('Event')

    if (existing.status === 'PUBLISHED') {
      throw new AppError('BUSINESS_RULE', 'Published events cannot be deleted. Cancel the event instead.', 409)
    }

    // tenant client rewrites delete → soft delete for Event
    await db.event.delete({ where: { id } })

    return ok({ success: true })
  }
})
