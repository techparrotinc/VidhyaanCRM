// One-off: fix orgs mistakenly created with status ACTIVE while actually in a
// free trial (TRIALING subscription + future trialEndsAt). Sets them to TRIAL so
// the trial UI / billing label / expiry cron recognise them. ADDITIVE, idempotent.
// Paid orgs (ACTIVE on a paid plan) are never touched.
// Usage: npx tsx scripts/backfill-trial-status.ts
import { prisma } from '../src/lib/db/client'

async function main() {
  const now = new Date()
  const candidates = await prisma.organization.findMany({
    where: {
      status: 'ACTIVE',
      trialEndsAt: { gt: now },
      subscriptions: { some: { status: 'TRIALING' } },
    },
    select: { id: true, name: true, plan: { select: { slug: true } } },
  })

  // Extra guard: only flip orgs on the free plan (never a paid ACTIVE org).
  const toFix = candidates.filter(o => !o.plan || o.plan.slug === 'free')

  for (const o of toFix) {
    await prisma.organization.update({ where: { id: o.id }, data: { status: 'TRIAL' } })
    console.log('  TRIAL ←', o.name, `(${o.id})`)
  }
  console.log(`Done: ${toFix.length} org(s) set to TRIAL (of ${candidates.length} candidates).`)
  await prisma.$disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
