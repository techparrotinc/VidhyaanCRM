import { Errors } from '@/lib/api/errors'

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type NewSlot = { dayOfWeek: number; startTime: string; endTime: string }

/** Two same-day slots overlap when [start,end) ranges intersect. */
function overlaps(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime
}

/**
 * Reject a proposed custom schedule if it double-books the student — either two
 * of the new slots collide, or a new slot overlaps another ACTIVE course's slot
 * for the same student (a student can't be in two classes at once). Excludes the
 * enrollment being (re)scheduled so re-saving the same course is fine.
 * `db` is the org-scoped Prisma client (typed `any` to avoid the extended-client
 * signature dance, same as other schedule helpers).
 */
export async function assertNoStudentScheduleConflict(
  db: any,
  args: { studentId: string; enrollmentId: string; slots: NewSlot[] }
): Promise<void> {
  // Within the new set.
  for (let i = 0; i < args.slots.length; i++) {
    for (let j = i + 1; j < args.slots.length; j++) {
      const a = args.slots[i]
      const b = args.slots[j]
      if (a.dayOfWeek === b.dayOfWeek && overlaps(a, b)) {
        throw Errors.validation({
          slots: [`Two periods clash on ${DAY_LABELS[a.dayOfWeek]} (${a.startTime}–${a.endTime} and ${b.startTime}–${b.endTime})`]
        })
      }
    }
  }

  // Against the student's other active course schedules.
  const existing = await db.enrollmentScheduleSlot.findMany({
    where: {
      studentId: args.studentId,
      enrollmentId: { not: args.enrollmentId },
      isActive: true,
      deletedAt: null,
      enrollment: { status: 'ACTIVE' }
    },
    select: { dayOfWeek: true, startTime: true, endTime: true, course: { select: { name: true } } }
  })

  type Existing = { dayOfWeek: number; startTime: string; endTime: string; course: { name: string } | null }
  for (const n of args.slots) {
    const clash = (existing as Existing[]).find((e) => e.dayOfWeek === n.dayOfWeek && overlaps(e, n))
    if (clash) {
      throw Errors.validation({
        slots: [
          `Clashes with ${clash.course?.name ?? 'another course'} on ${DAY_LABELS[n.dayOfWeek]} ${clash.startTime}–${clash.endTime}`
        ]
      })
    }
  }
}
