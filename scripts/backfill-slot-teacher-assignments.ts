// Backfill TeacherAssignment (attendance-marking scope) from existing
// TimetableSlot.teacherId. Historically the two were unlinked, so teachers set
// on timetable periods could not mark those classes' attendance. This grants
// each timetabled teacher the grade/section scope of the periods they teach.
// Idempotent — safe to re-run; upserts on (orgId, teacherId, targetKey).
// Usage: npx tsx scripts/backfill-slot-teacher-assignments.ts [--org <orgId>] [--dry]
import { prisma } from '../src/lib/db/client'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`)

// Mirrors src/lib/attendance/access.ts buildTargetKey — kept inline so the
// script has no app-runtime coupling.
function buildTargetKey(gradeLabel: string, section: string | null): string {
  return [gradeLabel ?? '', section ?? '', '', ''].join('|')
}

async function main() {
  const orgId = arg('org')
  const dry = hasFlag('dry')

  const slots = await prisma.timetableSlot.findMany({
    where: { teacherId: { not: null }, ...(orgId ? { orgId } : {}) },
    select: { orgId: true, teacherId: true, gradeLabel: true, section: true }
  })

  // De-dupe to unique (orgId, teacherId, targetKey) grants.
  const grants = new Map<string, { orgId: string; teacherId: string; gradeLabel: string; section: string | null; targetKey: string }>()
  for (const s of slots) {
    if (!s.teacherId || !s.gradeLabel) continue
    const targetKey = buildTargetKey(s.gradeLabel, s.section)
    const key = `${s.orgId}|${s.teacherId}|${targetKey}`
    if (!grants.has(key)) {
      grants.set(key, { orgId: s.orgId, teacherId: s.teacherId, gradeLabel: s.gradeLabel, section: s.section, targetKey })
    }
  }

  console.log(`${slots.length} teacher-bearing slots → ${grants.size} distinct grade/section grants${orgId ? ` for org ${orgId}` : ' (all orgs)'}.`)
  if (dry) {
    for (const g of grants.values()) console.log('  ', JSON.stringify(g))
    console.log('Dry run — nothing written.')
    return
  }

  let created = 0
  for (const g of grants.values()) {
    const res = await prisma.teacherAssignment.upsert({
      where: { orgId_teacherId_targetKey: { orgId: g.orgId, teacherId: g.teacherId, targetKey: g.targetKey } },
      create: { orgId: g.orgId, teacherId: g.teacherId, gradeLabel: g.gradeLabel, section: g.section, targetKey: g.targetKey },
      update: {},
      select: { createdAt: true }
    })
    // createdAt within the last few seconds ≈ freshly inserted (best-effort count).
    if (Date.now() - res.createdAt.getTime() < 5000) created++
  }
  console.log(`Done. ${grants.size} grants ensured (${created} newly created).`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
