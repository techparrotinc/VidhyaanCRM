// One-off backfill: create the `event_management` Module row and enable it
// for every existing (non-deleted) organization. New orgs get it via the
// signup coreModuleSlugs lists; this covers orgs created before the module
// existed. Safe to re-run (upsert + skipDuplicates).
//
// Run: npx tsx scripts/backfill-event-module.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const eventModule = await prisma.module.upsert({
    where: { slug: 'event_management' },
    update: {},
    create: {
      slug: 'event_management',
      name: 'Event Management',
      description: 'School events, open days, demo classes and RSVPs'
    }
  })
  console.log(`Module row: ${eventModule.id}`)

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true }
  })

  const result = await prisma.organizationModule.createMany({
    data: orgs.map((o) => ({
      orgId: o.id,
      moduleId: eventModule.id,
      enabled: true,
      enabledAt: new Date()
    })),
    skipDuplicates: true
  })

  console.log(`Orgs total: ${orgs.length}, newly enabled: ${result.count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
