import { NextRequest, NextResponse } from 'next/server'
import { rollupUsageDay, pruneRawUsage } from '@/lib/usage/rollup'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const RETENTION_DAYS = 120

// Nightly usage rollup + prune. Rolls up the trailing 3 UTC days (late writes
// self-heal) into platform.usage_daily_rollups, then prunes raw events/
// heartbeats older than the retention window. Optional ?date=YYYY-MM-DD to
// backfill a single day; ?prune=0 to skip pruning.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const doPrune = searchParams.get('prune') !== '0'

  const dayMs = 24 * 60 * 60 * 1000
  const days = dateParam ? [new Date(dateParam)] : [1, 2, 3].map((d) => new Date(Date.now() - d * dayMs))

  let rowsWritten = 0
  const errors: string[] = []
  for (const day of days) {
    try {
      rowsWritten += await rollupUsageDay(day)
    } catch (e: any) {
      errors.push(`${day.toISOString().slice(0, 10)}: ${e?.message || e}`)
    }
  }

  let pruned = { events: 0, heartbeats: 0 }
  if (doPrune) {
    try {
      pruned = await pruneRawUsage(RETENTION_DAYS)
    } catch (e: any) {
      errors.push(`prune: ${e?.message || e}`)
    }
  }

  return NextResponse.json({ ok: errors.length === 0, rowsWritten, pruned, retentionDays: RETENTION_DAYS, errors })
}
