/**
 * Seed billing.plan_prices from the pricing catalog (docs/pricing-strategy-2026.md §8).
 * Idempotent — upserts by (planId, slab). Safe to re-run.
 *
 * Usage: npx tsx scripts/seed-plan-prices.ts
 */
import { PrismaClient } from '@prisma/client'
import { PLAN_CATALOG, SLABS, ANNUAL_MONTHS, OVERAGE_PER_STUDENT } from '../src/lib/pricing/catalog'

const prisma = new PrismaClient()

async function main() {
  for (const entry of PLAN_CATALOG) {
    const plan = await prisma.plan.findUnique({ where: { slug: entry.slug } })
    if (!plan) {
      console.warn(`! plan slug "${entry.slug}" not found — skipping`)
      continue
    }
    for (const slab of SLABS) {
      const price = entry.slabs[slab.key]
      const data = {
        monthlyPrice: price.monthly,
        annualPrice: price.monthly * ANNUAL_MONTHS,
        launchMonthly: price.launchMonthly ?? null,
        bundledAiCredits: price.bundledAiCredits ?? 0,
        overagePerStudent: slab.key === 'S500_PLUS' ? OVERAGE_PER_STUDENT[entry.slug] ?? null : null,
      }
      await prisma.planPrice.upsert({
        where: { planId_slab: { planId: plan.id, slab: slab.key } },
        create: { planId: plan.id, slab: slab.key, ...data },
        update: data,
      })
      console.log(`✓ ${entry.slug} ${slab.key}: ₹${price.monthly}/mo${price.launchMonthly ? ` (launch ₹${price.launchMonthly})` : ''}`)
    }
  }
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
