// One-off: registers the attendance module in the catalog (prod DB is already
// seeded, so the seed.ts addition alone doesn't reach it), attaches it to the
// starter/growth/enterprise plans, and enables it for every org currently on
// one of those plans. Idempotent — safe to re-run.
//
//   npx tsx scripts/enable-attendance-module.ts
import { prisma } from '../src/lib/db/client'

const PLAN_SLUGS = ['starter', 'growth', 'enterprise']

async function main() {
  const mod = await prisma.module.upsert({
    where: { slug: 'attendance' },
    update: {},
    create: {
      slug: 'attendance',
      name: 'Attendance',
      description: 'Daily and per-session student attendance, holidays, biometric devices'
    }
  })
  console.log('module:', mod.id, mod.slug)

  const plans = await prisma.plan.findMany({ where: { slug: { in: PLAN_SLUGS } } })
  for (const plan of plans) {
    await prisma.planModule.upsert({
      where: { planId_moduleSlug: { planId: plan.id, moduleSlug: 'attendance' } },
      update: {},
      create: { planId: plan.id, moduleSlug: 'attendance' }
    })
    console.log('plan module:', plan.slug)
  }

  const orgs = await prisma.organization.findMany({
    where: { plan: { slug: { in: PLAN_SLUGS } }, deletedAt: null },
    select: { id: true, name: true }
  })
  for (const org of orgs) {
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: org.id, moduleId: mod.id } },
      update: { enabled: true },
      create: { orgId: org.id, moduleId: mod.id, enabled: true, enabledAt: new Date() }
    })
    console.log('enabled for org:', org.id, org.name)
  }
}

main().finally(() => prisma.$disconnect())
