// Make the Reports & Analytics module (advanced_reports) universal:
//  1. Add it to every plan's module set so billing reconcile/lifecycle never
//     disables it (the plan module list is the source of truth for those jobs).
//  2. Enable the OrganizationModule row for every existing non-dummy org and
//     bust the module cache so it shows up without waiting for a login refresh.
// New orgs are covered by the seed (plan modules) + the hardcoded creation
// lists — this script is a one-off for the existing fleet.
// Usage: npx tsx scripts/enable-reports-all-orgs.ts
import { prisma } from '../src/lib/db/client'
import { redis } from '../src/lib/redis'

const SLUG = 'advanced_reports'

async function main() {
  const reportsModule = await prisma.module.findUnique({ where: { slug: SLUG } })
  if (!reportsModule) throw new Error(`Module ${SLUG} not found — run the seed first`)

  // 1. Ensure every plan includes the module.
  const plans = await prisma.plan.findMany({ select: { id: true, slug: true } })
  let planRows = 0
  for (const plan of plans) {
    const existing = await prisma.planModule.findFirst({
      where: { planId: plan.id, moduleSlug: SLUG }
    })
    if (!existing) {
      await prisma.planModule.create({
        data: { planId: plan.id, moduleSlug: SLUG }
      })
      planRows++
      console.log(`  + plan '${plan.slug}' now includes ${SLUG}`)
    }
  }

  // 2. Enable for every existing real org.
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null, isDummy: false },
    select: { id: true }
  })
  let enabled = 0
  for (const org of orgs) {
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: org.id, moduleId: reportsModule.id } },
      update: { enabled: true, enabledAt: new Date(), disabledAt: null },
      create: { orgId: org.id, moduleId: reportsModule.id, enabled: true, enabledAt: new Date() }
    })
    // Bust the per-org module cache the route() composer reads.
    await redis.del(`org:${org.id}:module:${SLUG}`).catch(() => {})
    enabled++
  }

  console.log(`Done: ${planRows} plan(s) updated, ${SLUG} enabled for ${enabled} org(s).`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
