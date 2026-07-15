// One-off: diagnoses and fixes module-lock drift for a specific org — the
// case where OrganizationModule rows fell out of sync with what the org
// should have access to (trial orgs get the full Enterprise module set
// regardless of their nominal `planId`, which stays on the free plan during
// the trial; see src/app/api/auth/school/register/route.ts). Idempotent.
//
//   npx tsx scripts/fix-org-modules.ts "Seven Notes"        # dry-run, prints diagnosis
//   npx tsx scripts/fix-org-modules.ts "Seven Notes" --apply
//   npx tsx scripts/fix-org-modules.ts <org-id> --apply
import { prisma } from '../src/lib/db/client'
import { ENTERPRISE_MODULE_SLUGS } from '../src/constants/modules'
import { remapOrgModulesToPlan } from '../src/lib/billing/lifecycle'

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const query = args.find(a => !a.startsWith('--'))

  if (!query) {
    console.error('Usage: npx tsx scripts/fix-org-modules.ts <org name or id> [--apply]')
    process.exit(1)
  }

  const org = await prisma.organization.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: query }, { name: { contains: query, mode: 'insensitive' } }]
    },
    include: { plan: { select: { id: true, slug: true, name: true } } }
  })

  if (!org) {
    console.error(`No org found matching "${query}"`)
    process.exit(1)
  }

  console.log(`Org: ${org.name} (${org.id})`)
  console.log(`Status: ${org.status} | trialEndsAt: ${org.trialEndsAt?.toISOString() ?? '—'}`)
  console.log(`Plan: ${org.plan?.name ?? '—'} (${org.plan?.slug ?? '—'})`)

  const isTrialActive = org.status === 'TRIAL' && (!org.trialEndsAt || org.trialEndsAt > new Date())
  const isSchool = org.institutionType !== 'LEARNING_CENTER'

  const targetSlugs = isTrialActive
    ? ENTERPRISE_MODULE_SLUGS.filter(slug => isSchool || slug !== 'admission_management')
    : (org.plan
        ? (await prisma.planModule.findMany({ where: { planId: org.plan.id }, select: { moduleSlug: true } })).map(pm => pm.moduleSlug)
        : [])

  const current = await prisma.organizationModule.findMany({
    where: { orgId: org.id, enabled: true },
    include: { module: { select: { slug: true } } }
  })
  const currentSlugs = new Set(current.map(om => om.module.slug))

  const missing = targetSlugs.filter(slug => !currentSlugs.has(slug))
  const extra = [...currentSlugs].filter(slug => !targetSlugs.includes(slug as any))

  console.log(`\nExpected modules (${isTrialActive ? 'active trial → full Enterprise set' : `plan: ${org.plan?.slug}`}):`, targetSlugs)
  console.log('Currently enabled:', [...currentSlugs])
  console.log('Missing (locked but should be unlocked):', missing.length ? missing : 'none')
  console.log('Extra (enabled but not entitled):', extra.length ? extra : 'none')

  if (!apply) {
    console.log('\nDry run — pass --apply to fix.')
    return
  }

  if (isTrialActive) {
    const dbModules = await prisma.module.findMany({ where: { slug: { in: targetSlugs } } })
    for (const mod of dbModules) {
      await prisma.organizationModule.upsert({
        where: { orgId_moduleId: { orgId: org.id, moduleId: mod.id } },
        update: { enabled: true, enabledAt: new Date(), disabledAt: null },
        create: { orgId: org.id, moduleId: mod.id, enabled: true, enabledAt: new Date() }
      })
    }
    console.log(`Enabled ${dbModules.length} module(s) for trial org.`)
  } else if (org.plan) {
    const enabledSlugs = await remapOrgModulesToPlan(org.id, org.plan.id)
    console.log('Remapped modules to plan:', enabledSlugs)
  } else {
    console.log('Org has no plan and is not on an active trial — nothing to apply.')
  }
}

main().finally(() => prisma.$disconnect())
