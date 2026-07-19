/**
 * Manually applies the billing cron's trial-expiry transition (branch b of
 * /api/cron/billing) to one org: TRIAL → GRACE_PERIOD with a 7-day grace
 * window from trialEndsAt, subscription moved along with it. No emails sent.
 *
 * Needed on environments whose DB the Vercel cron never sweeps (e.g. the dev
 * DB behind app-dev/localhost — crons only run on the production deployment,
 * which points at the prod DB since the 2026-07-19 cutover).
 *
 * Usage: npx tsx --env-file=.env.local scripts/expire-trial-to-grace.ts <orgId>
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const GRACE_DAYS = 7

async function main() {
  const orgId = process.argv[2]
  if (!orgId) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/expire-trial-to-grace.ts <orgId>')
    process.exit(1)
  }
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, status: true, trialEndsAt: true }
  })
  if (!org) throw new Error(`org ${orgId} not found`)
  if (org.status !== 'TRIAL' || !org.trialEndsAt || org.trialEndsAt > new Date()) {
    console.log(`"${org.name}" is not in an expired-trial state, nothing to do:`, org)
    return
  }
  const graceEndsAt = new Date(org.trialEndsAt.getTime() + GRACE_DAYS * 86400000)
  await prisma.organization.update({ where: { id: orgId }, data: { status: 'GRACE_PERIOD' } })
  const sub = await prisma.subscription.findFirst({
    where: { orgId, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  })
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'GRACE_PERIOD', graceEndsAt, currentPeriodEnd: graceEndsAt }
    })
  }
  console.log(`"${org.name}" → GRACE_PERIOD until ${graceEndsAt.toISOString()} (sub ${sub?.id ?? 'none'})`)
}

main().finally(() => prisma.$disconnect())
