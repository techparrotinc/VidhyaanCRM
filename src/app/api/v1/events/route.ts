import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created, paginated } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { parseQuery, paginationShape, textParam } from '@/lib/api/query'
import { EVENT_TYPES } from '@/constants/events'

const createEventSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(EVENT_TYPES).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  startsAt: z.string().max(40),
  endsAt: z.string().max(40).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  meetingLink: z.string().max(1000).optional().nullable(),
  academicYearId: z.string().max(50).optional().nullable(),
  branchId: z.string().max(50).optional().nullable()
})

export const GET = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST],
  handler: async ({ req, db }) => {
    const q = parseQuery(req.url, {
      ...paginationShape,
      scope: z.enum(['upcoming', 'past', 'all']).catch('upcoming'),
      status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional().or(z.literal('').transform(() => undefined)),
      type: z.enum(EVENT_TYPES).optional().or(z.literal('').transform(() => undefined)),
      // month view: YYYY-MM loads that calendar month regardless of scope
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().or(z.literal('').transform(() => undefined)),
      search: textParam
    })
    const { page, limit, scope, status, type, month, search } = q
    const skip = (page - 1) * limit
    const now = new Date()

    const filters: any[] = []
    if (status) filters.push({ status })
    if (type) filters.push({ type })
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      })
    }
    if (month) {
      const [y, m] = month.split('-').map(Number)
      filters.push({ startsAt: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } })
    } else if (scope === 'upcoming') {
      // still running counts as upcoming
      filters.push({ OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }] })
    } else if (scope === 'past') {
      filters.push({ startsAt: { lt: now } })
      filters.push({ OR: [{ endsAt: null }, { endsAt: { lt: now } }] })
    }

    const where = filters.length > 0 ? { AND: filters } : {}
    const sortAsc = Boolean(month) || scope !== 'past'

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: sortAsc ? 'asc' : 'desc' },
        include: {
          _count: { select: { rsvps: true } }
        }
      }),
      db.event.count({ where })
    ])

    return paginated(events, total, page, limit)
  }
})

export const POST = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user, academicYearId }) => {
    const body = createEventSchema.parse(await req.json())

    const startsAt = new Date(body.startsAt)
    if (isNaN(startsAt.getTime())) {
      throw Errors.validation({ startsAt: ['Invalid date'] })
    }
    const endsAt = body.endsAt ? new Date(body.endsAt) : null
    if (endsAt && (isNaN(endsAt.getTime()) || endsAt < startsAt)) {
      throw Errors.validation({ endsAt: ['Must be a valid date after startsAt'] })
    }

    const event = await db.event.create({
      data: {
        orgId: user.orgId,
        title: body.title,
        description: body.description || null,
        type: body.type || 'OTHER',
        capacity: body.capacity ?? null,
        startsAt,
        endsAt,
        location: body.location || null,
        meetingLink: body.meetingLink || null,
        academicYearId: body.academicYearId || academicYearId || null,
        branchId: body.branchId || null,
        createdById: user.id
      }
    })

    return created(event)
  }
})
