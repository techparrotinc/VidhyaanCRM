import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { parseQuery, textParam } from '@/lib/api/query'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { DATE_RE, toDbDate } from '@/lib/attendance/dates'
import { getTeacherAssignments, ATTENDANCE_ADMIN_ROLES } from '@/lib/attendance/access'

const MARK_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TEACHER]

const sessionInclude = {
  course: { select: { id: true, name: true } },
  batch: { select: { id: true, name: true } },
  _count: { select: { records: true } }
} as const

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: MARK_ROLES,
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      date: z.string().regex(DATE_RE).optional(),
      from: z.string().regex(DATE_RE).optional(),
      to: z.string().regex(DATE_RE).optional(),
      courseId: textParam,
      batchId: textParam
    })

    const where: any = {}
    if (q.date) where.date = toDbDate(q.date)
    else if (q.from && q.to) where.date = { gte: toDbDate(q.from), lte: toDbDate(q.to) }
    if (q.courseId) where.courseId = q.courseId
    if (q.batchId) where.batchId = q.batchId

    // Teachers only see sessions for their assigned courses/batches.
    if (!ATTENDANCE_ADMIN_ROLES.includes(user.role)) {
      const assignments = await getTeacherAssignments(db, user.id)
      const courseIds = assignments.map(a => a.courseId).filter(Boolean) as string[]
      const batchIds = assignments.map(a => a.batchId).filter(Boolean) as string[]
      where.OR = [{ courseId: { in: courseIds } }, { batchId: { in: batchIds } }]
    }

    const sessions = await db.attendanceSession.findMany({
      where,
      include: sessionInclude,
      orderBy: [{ date: 'desc' }, { startsAt: 'asc' }],
      take: 200
    })
    return ok({ sessions })
  }
})

const createSchema = z
  .object({
    date: z.string().regex(DATE_RE),
    courseId: z.string().optional(),
    batchId: z.string().optional(),
    title: z.string().max(200).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    deliveryMode: z.enum(['IN_PERSON', 'ONLINE']).default('IN_PERSON')
  })
  .refine(v => !!v.courseId !== !!v.batchId, {
    message: 'Provide exactly one of courseId or batchId'
  })

export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: MARK_ROLES,
  handler: async ({ req, db, user, academicYearId }) => {
    const body = createSchema.parse(await req.json())

    if (body.courseId) {
      const course = await db.course.findUnique({ where: { id: body.courseId } })
      if (!course) throw Errors.notFound('Course')
    } else if (body.batchId) {
      const batch = await db.studentBatch.findUnique({ where: { id: body.batchId } })
      if (!batch) throw Errors.notFound('Batch')
    }

    const session = await db.attendanceSession.create({
      data: {
        orgId: user.orgId,
        date: toDbDate(body.date),
        courseId: body.courseId ?? null,
        batchId: body.batchId ?? null,
        title: body.title,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        deliveryMode: body.deliveryMode,
        academicYearId,
        createdById: user.id
      },
      include: sessionInclude
    })
    return created({ session })
  }
})
