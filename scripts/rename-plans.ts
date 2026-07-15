/**
 * Rename subscription plans + realign plan modules to the 2026 pricing strategy.
 * Slugs are NOT changed (referenced across the codebase) — only names,
 * descriptions, and PlanModule mappings.
 *
 * Usage:
 *   npx tsx scripts/rename-plans.ts            # dry-run (default, no writes)
 *   npx tsx scripts/rename-plans.ts --apply    # apply name/description changes
 *   npx tsx scripts/rename-plans.ts --apply --force-modules
 *       # also remap modules for plans that have live orgs attached
 *
 * Module remap is skipped for any plan with active (non-deleted) organizations
 * unless --force-modules is passed, because removing modules changes access
 * for live customers immediately.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ALL_MODULES = [
  'lead_management',
  'admission_management',
  'student_management',
  'fee_management',
  'campaign_management',
  'event_management',
  'advanced_reports',
  'payment_gateway',
  'whatsapp_sms_notifications',
  'forms_requests',
  'admission_workflow',
  'student_lifecycle',
  'api_access',
  'custom_domain',
  'ai_copilot',
  'attendance',
  'course_schedule',
]

const PLAN_UPDATES: {
  slug: string
  name: string
  description: string
  leadCap: number | null
  modules: string[]
}[] = [
  {
    slug: 'free',
    name: 'Free Listing',
    description: 'Free public listing on the Vidhyaan directory with basic lead capture (up to 10 leads).',
    leadCap: 10,
    modules: ['lead_management', 'advanced_reports'],
  },
  {
    slug: 'starter',
    name: 'CRM Package',
    description: 'Lead, Admission & Campaign Management — pipeline, counsellors, follow-ups, events, core reports.',
    leadCap: null,
    modules: [
      'lead_management',
      'admission_management',
      'admission_workflow',
      'campaign_management',
      'event_management',
      'forms_requests',
      'whatsapp_sms_notifications',
      'advanced_reports',
      'attendance',
    ],
  },
  {
    slug: 'growth',
    name: 'Fee Management',
    description: 'Student & Fee Management — fee structures, invoices, online payments, receipts, dues, financial reports.',
    leadCap: null,
    modules: [
      'student_management',
      'student_lifecycle',
      'fee_management',
      'payment_gateway',
      'whatsapp_sms_notifications',
      'attendance',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Everything in CRM Package and Fee Management plus AI, Parent Portal, advanced reports, and integrations.',
    leadCap: null,
    modules: ALL_MODULES,
  },
]

async function main() {
  const apply = process.argv.includes('--apply')
  const forceModules = process.argv.includes('--force-modules')
  console.log(apply ? '=== APPLY MODE ===' : '=== DRY RUN (no writes; pass --apply) ===')

  for (const update of PLAN_UPDATES) {
    const plan = await prisma.plan.findUnique({
      where: { slug: update.slug },
      include: { planModules: true },
    })
    if (!plan) {
      console.warn(`! plan slug "${update.slug}" not found — skipping`)
      continue
    }

    const activeOrgs = await prisma.organization.count({
      where: { planId: plan.id, deletedAt: null },
    })

    const currentModules = plan.planModules.map((m) => m.moduleSlug).sort()
    const targetModules = [...update.modules].sort()
    const toAdd = targetModules.filter((m) => !currentModules.includes(m))
    const toRemove = currentModules.filter((m) => !targetModules.includes(m))

    console.log(`\n[${update.slug}] "${plan.name}" → "${update.name}" (${activeOrgs} active orgs)`)
    if (plan.leadCap !== update.leadCap) console.log(`  leadCap: ${plan.leadCap} → ${update.leadCap}`)
    if (toAdd.length) console.log(`  modules +: ${toAdd.join(', ')}`)
    if (toRemove.length) console.log(`  modules -: ${toRemove.join(', ')}`)
    if (!toAdd.length && !toRemove.length) console.log('  modules: already aligned')

    if (!apply) continue

    await prisma.plan.update({
      where: { id: plan.id },
      data: { name: update.name, description: update.description, leadCap: update.leadCap },
    })
    console.log('  ✓ name/description/leadCap updated')

    const remapAllowed = activeOrgs === 0 || forceModules
    if ((toAdd.length || toRemove.length) && !remapAllowed) {
      console.log(`  ⚠ module remap SKIPPED — ${activeOrgs} live orgs on this plan (use --force-modules)`)
      continue
    }
    if (toRemove.length) {
      await prisma.planModule.deleteMany({
        where: { planId: plan.id, moduleSlug: { in: toRemove } },
      })
    }
    if (toAdd.length) {
      await prisma.planModule.createMany({
        data: toAdd.map((moduleSlug) => ({ planId: plan.id, moduleSlug })),
        skipDuplicates: true,
      })
    }
    if (toAdd.length || toRemove.length) console.log('  ✓ modules remapped')
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
