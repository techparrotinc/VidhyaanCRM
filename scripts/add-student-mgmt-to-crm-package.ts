// One-off (shared prod DB): add student_management to the CRM Package (starter)
// plan's module grant. Seed can't run on prod (it deletes all planModules), so
// this inserts just the missing row. Idempotent.
//
//   npx tsx scripts/add-student-mgmt-to-crm-package.ts            # dry-run
//   npx tsx scripts/add-student-mgmt-to-crm-package.ts --apply
import { prisma } from '../src/lib/db/client'

async function main() {
  const apply = process.argv.includes('--apply')
  const plan = await prisma.plan.findUnique({ where: { slug: 'starter' }, select: { id: true, name: true } })
  if (!plan) {
    console.error('starter plan not found')
    process.exit(1)
  }

  const existing = await prisma.planModule.findFirst({
    where: { planId: plan.id, moduleSlug: 'student_management' }
  })
  console.log(`Plan: ${plan.name} (starter)`)
  console.log(`student_management currently granted: ${existing ? 'yes' : 'no'}`)

  if (existing) {
    console.log('Nothing to do.')
    return
  }
  if (!apply) {
    console.log('\nDry run — pass --apply to insert the planModule row.')
    console.log('Then run: npx tsx scripts/fix-org-modules.ts "Seven Notes" --apply')
    return
  }

  await prisma.planModule.create({ data: { planId: plan.id, moduleSlug: 'student_management' } })
  console.log('Inserted planModule (starter → student_management).')
  console.log('Next: npx tsx scripts/fix-org-modules.ts "Seven Notes" --apply')
}

main().finally(() => prisma.$disconnect())
