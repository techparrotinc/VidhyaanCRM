import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { rollupOrgDay, istDateString } from '@/lib/reports/rollup'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Nightly (01:30 IST) rollup into reporting.daily_rollups. Recomputes the
// trailing 3 IST days so late payments and edits self-heal. Optional query
// params for targeted backfill: ?date=YYYY-MM-DD&orgId=...
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const orgIdParam = searchParams.get('orgId')

  const dayMs = 24 * 60 * 60 * 1000
  const dates = dateParam
    ? [dateParam]
    : [1, 2, 3].map(d => istDateString(new Date(Date.now() - d * dayMs)))

  const orgs = orgIdParam
    ? [{ id: orgIdParam }]
    : await prisma.organization.findMany({
        where: { deletedAt: null, isDummy: false },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      })

  let rowsWritten = 0
  let orgDaysFailed = 0
  const errors: string[] = []

  for (const org of orgs) {
    for (const date of dates) {
      try {
        rowsWritten += await rollupOrgDay(prisma, org.id, date)
      } catch (err) {
        orgDaysFailed++
        if (errors.length < 10) {
          errors.push(`${org.id} ${date}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }
  }

  return NextResponse.json({
    orgs: orgs.length,
    dates,
    rowsWritten,
    orgDaysFailed,
    errors
  })
}
