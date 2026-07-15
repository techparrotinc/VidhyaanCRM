import { ROLES } from '@/constants/roles'
import { Errors } from '@/lib/api/errors'
import type { OrgScopedClient } from '@/lib/db/tenant'

/** Roles that see/manage every session in the org without an assignment. */
export const SCHEDULE_ADMIN_ROLES: string[] = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

/** Roles allowed to read the schedule read-only (front-desk lookups). */
export const SCHEDULE_READ_ROLES: string[] = [
  ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST, ROLES.TEACHER
]

/** courseId/batchId pairs a teacher is assigned to, via TeacherAssignment. */
export async function teacherTargets(
  db: OrgScopedClient,
  teacherId: string
): Promise<{ courseIds: string[]; batchIds: string[] }> {
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { courseId: true, batchId: true }
  })
  return {
    courseIds: assignments.map(a => a.courseId).filter((v): v is string => !!v),
    batchIds: assignments.map(a => a.batchId).filter((v): v is string => !!v)
  }
}

/** Prisma `where` clause scoping sessions to a teacher's own assignments. */
export function teacherSessionWhere(targets: { courseIds: string[]; batchIds: string[] }) {
  return { OR: [{ courseId: { in: targets.courseIds } }, { batchId: { in: targets.batchIds } }] }
}

function matchesTarget(
  targets: { courseIds: string[]; batchIds: string[] },
  session: { courseId: string | null; batchId: string }
): boolean {
  if (session.courseId && targets.courseIds.includes(session.courseId)) return true
  return targets.batchIds.includes(session.batchId)
}

/** Throws 403 unless the user may act on this session (reschedule/cancel = admin only). */
export function assertCanManage(user: { role: string }): void {
  if (!SCHEDULE_ADMIN_ROLES.includes(user.role)) {
    throw Errors.forbidden('Only an admin can reschedule or cancel a session')
  }
}

/**
 * Throws 403 unless the user may remind/mark-attendance for this session.
 * Admin roles always pass; TEACHER needs a matching TeacherAssignment;
 * COUNSELLOR/RECEPTIONIST are read-only and never pass.
 */
export async function assertCanAct(
  db: OrgScopedClient,
  user: { id: string; role: string },
  session: { courseId: string | null; batchId: string }
): Promise<void> {
  if (SCHEDULE_ADMIN_ROLES.includes(user.role)) return
  if (user.role !== ROLES.TEACHER) throw Errors.forbidden('Your role cannot perform this action')
  const targets = await teacherTargets(db, user.id)
  if (!matchesTarget(targets, session)) {
    throw Errors.forbidden('You are not assigned to this session')
  }
}
