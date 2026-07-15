import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { materializeBatch, defaultTeacherId } from '@/lib/schedule/materialize'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  courseId: z.string().nullable().optional(),
  daysOfWeek: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).max(7).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  sessionDurationMin: z.number().int().min(5).max(480).nullable().optional(),
  capacity: z.number().int().min(1).max(10000).nullable().optional(),
  isActive: z.boolean().optional()
})

export const PATCH = route({
  roles: ADMIN_ROLES,
  handler: async ({ req, db, params }) => {
    const id = (await params)?.id
    const body = patchSchema.parse(await req.json())
    const existing = await db.studentBatch.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) throw Errors.notFound('Batch')

    if (body.courseId) {
      const course = await db.course.findUnique({ where: { id: body.courseId } })
      if (!course) throw Errors.notFound('Course')
    }

    const batch = await db.studentBatch.update({
      where: { id },
      data: body,
      include: {
        course: { select: { id: true, name: true } },
        _count: { select: { students: true } }
      }
    })

    if (batch.isActive && batch.startTime && batch.daysOfWeek.length > 0) {
      await materializeBatch(db, batch, { teacherId: await defaultTeacherId(db, batch) })
        .catch(err => console.error('Schedule materialize (batch update):', err))
    }

    return ok({ batch })
  }
})

export const DELETE = route({
  roles: ADMIN_ROLES,
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    const existing = await db.studentBatch.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } }
    })
    if (!existing || existing.deletedAt) throw Errors.notFound('Batch')
    if (existing._count.students > 0) {
      throw Errors.validation({
        batch: [`${existing.name} has ${existing._count.students} student(s) assigned. Reassign them first.`]
      })
    }
    await db.studentBatch.update({ where: { id }, data: { deletedAt: new Date() } })
    return ok({ deleted: true })
  }
})
