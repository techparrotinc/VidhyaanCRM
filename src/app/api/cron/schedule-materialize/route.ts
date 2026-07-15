import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'
import { materializeBatch, defaultTeacherId } from '@/lib/schedule/materialize'

// Daily: rolls every active batch's recurring pattern ~2 weeks ahead into
// CourseSession rows. Idempotent (materializeBatch never touches an
// already-materialized slot), so re-running after a partial failure is safe.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgIds = (
    await prisma.organizationModule.findMany({
      where: { enabled: true, module: { slug: MODULES.COURSE_SCHEDULE } },
      select: { orgId: true }
    })
  ).map(r => r.orgId)
  if (orgIds.length === 0) return NextResponse.json({ ok: true, batches: 0, created: 0 })

  const batches = await prisma.studentBatch.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      isActive: true,
      startTime: { not: null }
    }
  })

  let created = 0
  for (const batch of batches) {
    if (batch.daysOfWeek.length === 0) continue
    const teacherId = await defaultTeacherId(prisma, batch)
    created += await materializeBatch(prisma, batch, { teacherId }).catch(err => {
      console.error('Schedule materialize (cron):', batch.id, err)
      return 0
    })
  }

  return NextResponse.json({ ok: true, batches: batches.length, created })
}
