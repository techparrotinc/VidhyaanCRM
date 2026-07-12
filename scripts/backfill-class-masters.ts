// One-off: seeds the SchoolClass/ClassSection master for existing school-type
// orgs from their current student data (distinct gradeLabel+section pairs).
// Orgs that already have SchoolClass rows are skipped. Idempotent.
//
//   npx tsx scripts/backfill-class-masters.ts --dry-run   # print planned rows
//   npx tsx scripts/backfill-class-masters.ts             # write
import { prisma } from '../src/lib/db/client'
import { GRADE_LABEL_OPTIONS } from '../src/constants/grades'
import { LC_INSTITUTION_TYPES } from '../src/lib/institution'
import { mapGradeValue } from '../src/lib/utils/gradeMapping'

const dryRun = process.argv.includes('--dry-run')
const ladder = new Map(GRADE_LABEL_OPTIONS.map((label, i) => [label.toLowerCase(), i]))

async function main() {
  const orgs = await prisma.organization.findMany({
    where: {
      deletedAt: null,
      institutionType: { notIn: LC_INSTITUTION_TYPES as never },
      schoolClasses: { none: {} }
    },
    select: { id: true, name: true }
  })
  console.log(`${orgs.length} school-type org(s) without class master${dryRun ? ' (dry run)' : ''}`)

  for (const org of orgs) {
    const pairs = await prisma.student.groupBy({
      by: ['gradeLabel', 'section'],
      where: { orgId: org.id, deletedAt: null, gradeLabel: { not: null } }
    })
    if (pairs.length === 0) {
      console.log(`- ${org.name}: no students with a class, skipped`)
      continue
    }

    // class name → set of sections
    const classes = new Map<string, Set<string>>()
    for (const p of pairs) {
      const name = (p.gradeLabel as string).trim()
      if (!name) continue
      const sections = classes.get(name) ?? new Set<string>()
      if (p.section?.trim()) sections.add(p.section.trim())
      classes.set(name, sections)
    }

    console.log(`- ${org.name}: ${classes.size} class(es)`)
    for (const [name, sections] of classes) {
      const sortOrder = ladder.get(name.toLowerCase()) ?? 900 + name.charCodeAt(0)
      const secList = [...sections].sort()
      console.log(`    ${name}${secList.length ? ` [${secList.join(', ')}]` : ''}`)
      if (dryRun) continue

      const cls = await prisma.schoolClass.upsert({
        where: { orgId_name: { orgId: org.id, name } },
        update: {},
        create: { orgId: org.id, name, gradeSlug: mapGradeValue(name), sortOrder }
      })
      if (secList.length > 0) {
        await prisma.classSection.createMany({
          data: secList.map(s => ({ orgId: org.id, classId: cls.id, name: s })),
          skipDuplicates: true
        })
      }
    }
  }
}

main().finally(() => prisma.$disconnect())
