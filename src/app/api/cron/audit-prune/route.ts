import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { resolveRetentionDays } from '@/lib/audit/retention'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Nightly (02:00 IST) prune of activity/audit logs past each org's retention
// window (organization.settings.activityLog.retentionDays; 0 = keep forever,
// unset = default). Deletes org-scoped rows only; platform-level rows
// (orgId = null: auth/impersonation) are never touched here.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true, settings: true },
  })

  const dayMs = 24 * 60 * 60 * 1000
  let orgsPruned = 0
  let rowsDeleted = 0
  const errors: string[] = []

  for (const org of orgs) {
    const days = resolveRetentionDays(org.settings)
    if (days <= 0) continue // keep forever

    const cutoff = new Date(Date.now() - days * dayMs)
    try {
      const res = await prisma.auditLog.deleteMany({
        where: { orgId: org.id, createdAt: { lt: cutoff } },
      })
      if (res.count > 0) {
        orgsPruned++
        rowsDeleted += res.count
      }
    } catch (err) {
      errors.push(`${org.id}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    orgsScanned: orgs.length,
    orgsPruned,
    rowsDeleted,
    errors: errors.length ? errors : undefined,
  })
}
