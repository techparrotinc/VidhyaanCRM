import type { OrgScopedClient } from '@/lib/db/tenant'
import { buildTargetKey } from '@/lib/attendance/access'

// Bridges the timetable to attendance-marking scope. A school period's teacher
// (TimetableSlot.teacherId) and the marking permission (TeacherAssignment) were
// separate concepts with no link, so a timetabled teacher could not actually
// mark that class's attendance. Whenever a slot is saved with a teacher, ensure
// a matching grade/section TeacherAssignment exists so assertCanMark() passes.
//
// Additive + idempotent: it never deletes assignments (a teacher may hold the
// same grade/section scope from another slot or a manual grant), so dropping a
// teacher from one period does not silently revoke their marking rights.
export async function syncSlotTeacherAssignment(
  db: OrgScopedClient,
  slot: { orgId: string; teacherId: string | null; gradeLabel: string; section: string | null }
): Promise<void> {
  if (!slot.teacherId || !slot.gradeLabel) return

  const targetKey = buildTargetKey({ gradeLabel: slot.gradeLabel, section: slot.section })
  await db.teacherAssignment.upsert({
    where: {
      orgId_teacherId_targetKey: {
        orgId: slot.orgId,
        teacherId: slot.teacherId,
        targetKey
      }
    },
    create: {
      orgId: slot.orgId,
      teacherId: slot.teacherId,
      gradeLabel: slot.gradeLabel,
      section: slot.section,
      targetKey
    },
    update: {}
  })
}
