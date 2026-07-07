// One-off: registers the ai_copilot module in the catalog (prod DB is already
// seeded, so the seed.ts addition alone doesn't reach it) and optionally
// enables it for specific orgs during the beta.
//
//   npx tsx scripts/enable-ai-copilot-module.ts            # catalog only
//   npx tsx scripts/enable-ai-copilot-module.ts <orgId>... # + enable for orgs
import { prisma } from '../src/lib/db/client'

async function main() {
  const mod = await prisma.module.upsert({
    where: { slug: 'ai_copilot' },
    update: {},
    create: {
      slug: 'ai_copilot',
      name: 'AI Copilot',
      description: 'Vidhyaan AI assistant — usage-billed add-on'
    }
  })
  console.log('module:', mod.id, mod.slug)

  for (const orgId of process.argv.slice(2)) {
    const row = await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId, moduleId: mod.id } },
      update: { enabled: true },
      create: { orgId, moduleId: mod.id, enabled: true }
    })
    console.log('enabled for org:', orgId, row.id)
  }
}

main().finally(() => prisma.$disconnect())
