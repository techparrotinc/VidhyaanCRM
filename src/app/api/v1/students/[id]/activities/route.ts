import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created, ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const schema = z.object({
  type: z.enum([
    'NOTE', 'CALL', 'WHATSAPP', 'EMAIL'
  ]),
  summary: z.string().min(1),
  note: z.string().optional()
})

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params }) => {
    const id = params?.id
    if (!id) {
      throw Errors.notFound('Student')
    }

    const student = await db.student.findFirst({ where: { id } })
    if (!student) {
      throw Errors.notFound('Student')
    }

    const activities = await db.studentActivity.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return ok(activities)
  }
})

export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user, params }) => {
    const id = params?.id
    if (!id) {
      throw Errors.notFound('Student')
    }
    const body = schema.parse(await req.json())

    const student = await db.student.findFirst({ where: { id } })
    if (!student) {
      throw Errors.notFound('Student')
    }

    const activity = await db.studentActivity.create({
      data: {
        studentId: id,
        type: body.type,
        summary: body.summary,
        note: body.note,
        performedById: user.id
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return created(activity)
  }
})
