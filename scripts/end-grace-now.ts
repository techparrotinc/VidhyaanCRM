/**
 * QA helper: backdates an org's grace period so it lapses immediately.
 * The org stays GRACE_PERIOD — the next dashboard load (or billing cron)
 * performs the real TRIAL→free downgrade through downgradeOrgToFree,
 * exercising the production code path instead of hand-editing plan rows.
 *
 * Usage: npx tsx --env-file=.env.local scripts/end-grace-now.ts <orgId>
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orgId = process.argv[2]
  if (!orgId) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/end-grace-now.ts <orgId>')
    process.exit(1)
  }
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, status: true }
  })
  if (!org) throw new Error(`org ${orgId} not found`)
  if (org.status !== 'GRACE_PERIOD') {
    console.log(`"${org.name}" is not in GRACE_PERIOD (status: ${org.status}), nothing to do`)
    return
  }
  const past = new Date(Date.now() - 60_000)
  const { count } = await prisma.subscription.updateMany({
    where: { orgId, deletedAt: null, status: 'GRACE_PERIOD' },
    data: { graceEndsAt: past, currentPeriodEnd: past }
  })
  console.log(
    `"${org.name}": graceEndsAt backdated on ${count} subscription(s). ` +
      'Open the dashboard (after the 5-min summary cache expires) to trigger the free-plan downgrade.'
  )
}

main().finally(() => prisma.$disconnect())
