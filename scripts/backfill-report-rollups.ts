// One-time backfill of reporting.daily_rollups for existing data.
// Usage: npx tsx scripts/backfill-report-rollups.ts [--from 2025-04-01] [--to 2026-07-07] [--org <orgId>]
// Defaults: from = 15 months ago (covers current + previous academic year),
// to = yesterday (IST). Note: students_active is a snapshot metric and is
// only written for yesterday — historical headcounts cannot be reconstructed.
import { prisma } from '../src/lib/db/client'
import { rollupOrgDay, istDateString } from '../src/lib/reports/rollup'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const dayMs = 24 * 60 * 60 * 1000
  const from = arg('from') ?? istDateString(new Date(Date.now() - 456 * dayMs))
  const to = arg('to') ?? istDateString(new Date(Date.now() - dayMs))
  const orgFilter = arg('org')

  const orgs = orgFilter
    ? [{ id: orgFilter }]
    : await prisma.organization.findMany({
        where: { deletedAt: null, isDummy: false },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      })

  const dates: string[] = []
  for (
    let t = new Date(`${from}T00:00:00Z`).getTime();
    t <= new Date(`${to}T00:00:00Z`).getTime();
    t += dayMs
  ) {
    dates.push(new Date(t).toISOString().slice(0, 10))
  }

  console.log(`Backfilling ${orgs.length} org(s) × ${dates.length} day(s): ${from} → ${to}`)

  let rows = 0
  for (const org of orgs) {
    for (const date of dates) {
      rows += await rollupOrgDay(prisma as any, org.id, date)
    }
    console.log(`  org ${org.id} done (${rows} rows cumulative)`)
  }

  console.log(`Backfill complete: ${rows} rollup rows written.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
