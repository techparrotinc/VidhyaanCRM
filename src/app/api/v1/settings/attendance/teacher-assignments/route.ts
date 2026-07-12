import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { buildTargetKey } from '@/lib/attendance/access'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

const assignmentInclude = {
  teacher: { select: { id: true, name: true, email: true } },
  course: { select: { id: true, name: true } },
  batch: { select: { id: true, name: true } }
} as const

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ db }) => {
    const assignments = await db.teacherAssignment.findMany({
      include: assignmentInclude,
      orderBy: { createdAt: 'desc' }
    })
    return ok({ assignments })
  }
})

const postSchema = z
  .object({
    teacherId: z.string().min(1),
    gradeLabel: z.string().trim().max(100).optional(),
    section: z.string().trim().max(50).optional(),
    courseId: z.string().optional(),
    batchId: z.string().optional()
  })
  .refine(
    v => [!!v.gradeLabel, !!v.courseId, !!v.batchId].filter(Boolean).length === 1,
    { message: 'Provide exactly one target: gradeLabel(+section), courseId or batchId' }
  )
  .refine(v => !v.section || !!v.gradeLabel, {
    message: 'section requires gradeLabel'
  })

export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const body = postSchema.parse(await req.json())

    const teacher = await db.user.findFirst({
      where: {
        id: body.teacherId,
        orgId: user.orgId,
        deletedAt: null,
        roleAssignments: { some: { role: 'TEACHER', status: 'ACTIVE' } }
      },
      select: { id: true }
    })
    if (!teacher) throw Errors.notFound('Teacher')

    if (body.courseId) {
      const course = await db.course.findUnique({ where: { id: body.courseId } })
      if (!course) throw Errors.notFound('Course')
    }
    if (body.batchId) {
      const batch = await db.studentBatch.findUnique({ where: { id: body.batchId } })
      if (!batch) throw Errors.notFound('Batch')
    }

    const target = {
      gradeLabel: body.gradeLabel ?? null,
      section: body.section ?? null,
      courseId: body.courseId ?? null,
      batchId: body.batchId ?? null
    }
    const assignment = await db.teacherAssignment.upsert({
      where: {
        orgId_teacherId_targetKey: {
          orgId: user.orgId,
          teacherId: body.teacherId,
          targetKey: buildTargetKey(target)
        }
      },
      create: { orgId: user.orgId, teacherId: body.teacherId, ...target, targetKey: buildTargetKey(target) },
      update: {},
      include: assignmentInclude
    })
    return created({ assignment })
  }
})
