// Set-based backfill of reporting.daily_rollups — one aggregate query per
// metric across all orgs and days (seconds, not hours; the old per-org
// per-day loop was O(orgs × days) round-trips).
// Usage: npx tsx scripts/backfill-report-rollups.ts [--from 2025-04-01] [--to 2026-07-07] [--org <orgId>]
// Defaults: from = 15 months ago, to = yesterday (IST). students_active is a
// snapshot metric, only written for yesterday.
import { prisma } from '../src/lib/db/client'
import { istDateString } from '../src/lib/reports/rollup'
import { backfillRollupRange } from '../src/lib/reports/rollup-backfill'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const dayMs = 24 * 60 * 60 * 1000
  const from = arg('from') ?? istDateString(new Date(Date.now() - 456 * dayMs))
  const to = arg('to') ?? istDateString(new Date(Date.now() - dayMs))
  const orgId = arg('org')

  console.log(`Backfilling ${from} → ${to}${orgId ? ` for org ${orgId}` : ' (all orgs)'}…`)
  const started = Date.now()
  const rows = await backfillRollupRange(prisma as never, { from, to, orgId })
  console.log(`Backfill complete: ${rows} rollup rows in ${((Date.now() - started) / 1000).toFixed(1)}s.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
