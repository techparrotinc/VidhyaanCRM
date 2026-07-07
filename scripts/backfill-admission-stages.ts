// One-off backfill: seed the default admission pipeline stages for every
// existing (non-deleted) organization that has none. New orgs get them at
// signup via createDefaultAdmissionStages; this covers orgs created before
// that hook existed (e.g. AGM Global School). Safe to re-run — orgs with
// any stage rows (even soft-deleted) are skipped.
//
// Run: npx tsx scripts/backfill-admission-stages.ts
import { PrismaClient } from '@prisma/client'
import { DEFAULT_ADMISSION_STAGES } from '../src/lib/utils/createDefaultAdmissionStages'

const prisma = new PrismaClient()

async function main() {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true }
  })

  let seeded = 0
  for (const org of orgs) {
    const existing = await prisma.admissionStage.count({ where: { orgId: org.id } })
    if (existing > 0) continue

    await prisma.admissionStage.createMany({
      data: DEFAULT_ADMISSION_STAGES.map((stage) => ({ orgId: org.id, ...stage })),
      skipDuplicates: true
    })
    console.log(`Seeded 8 stages for: ${org.name} (${org.id})`)
    seeded++
  }

  console.log(`Done. ${seeded}/${orgs.length} orgs seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
