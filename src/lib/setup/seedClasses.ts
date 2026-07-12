// Seeds the SchoolClass master from an onboarding grade range
// (e.g. "LKG" → "Class 10"). Idempotent — unique (orgId, name) +
// skipDuplicates make re-runs safe.

import { prisma } from '@/lib/db/client'
import { GRADE_RANGE_OPTIONS } from '@/constants/grades'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

/**
 * Creates one SchoolClass per ladder step between gradeFrom and gradeTo
 * (inclusive), with sortOrder = ladder index. No default sections — sections
 * are school-specific and added in /settings/classes.
 * Returns number of classes created (0 when range invalid or already seeded).
 */
export async function seedClassesFromRange(
  orgId: string,
  gradeFrom: string,
  gradeTo: string
): Promise<number> {
  const ladder = GRADE_RANGE_OPTIONS as readonly string[]
  const fromIdx = ladder.findIndex(g => g.toLowerCase() === gradeFrom.toLowerCase())
  const toIdx = ladder.findIndex(g => g.toLowerCase() === gradeTo.toLowerCase())
  if (fromIdx === -1 || toIdx === -1 || toIdx < fromIdx) return 0

  const names = ladder.slice(fromIdx, toIdx + 1)
  const result = await prisma.schoolClass.createMany({
    data: names.map((name, i) => ({
      orgId,
      name,
      gradeSlug: mapGradeValue(name),
      sortOrder: fromIdx + i
    })),
    skipDuplicates: true
  })
  return result.count
}
