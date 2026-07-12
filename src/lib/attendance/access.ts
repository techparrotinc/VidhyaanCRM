import { ROLES } from '@/constants/roles'
import { Errors } from '@/lib/api/errors'
import type { OrgScopedClient } from '@/lib/db/tenant'

export type MarkTarget = {
  gradeLabel?: string | null
  section?: string | null
  courseId?: string | null
  batchId?: string | null
}

/** Non-null tuple for the (orgId, teacherId, targetKey) unique. */
export function buildTargetKey(t: MarkTarget): string {
  return [t.gradeLabel ?? '', t.section ?? '', t.courseId ?? '', t.batchId ?? ''].join('|')
}

/** Roles that may mark/see every class without an assignment. */
export const ATTENDANCE_ADMIN_ROLES: string[] = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

export async function getTeacherAssignments(db: OrgScopedClient, teacherId: string) {
  return db.teacherAssignment.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'asc' }
  })
}

function matchesAssignment(
  a: { gradeLabel: string | null; section: string | null; courseId: string | null; batchId: string | null },
  t: MarkTarget
): boolean {
  if (t.courseId) return a.courseId === t.courseId
  if (t.batchId) return a.batchId === t.batchId
  if (t.gradeLabel) {
    if (a.gradeLabel?.toLowerCase() !== t.gradeLabel.toLowerCase()) return false
    // Assignment without a section covers every section of that grade.
    return !a.section || a.section.toLowerCase() === (t.section ?? '').toLowerCase()
  }
  return false
}

/**
 * Throws 403 unless the user may mark the requested target.
 * Admin roles always pass; TEACHER needs a matching TeacherAssignment.
 */
export async function assertCanMark(
  db: OrgScopedClient,
  user: { id: string; role: string },
  target: MarkTarget
): Promise<void> {
  if (ATTENDANCE_ADMIN_ROLES.includes(user.role)) return
  const assignments = await getTeacherAssignments(db, user.id)
  if (!assignments.some(a => matchesAssignment(a, target))) {
    throw Errors.forbidden('You are not assigned to this class')
  }
}
