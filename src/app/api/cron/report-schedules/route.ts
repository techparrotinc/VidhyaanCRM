import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { cadenceDueToday, nowInIst } from '@/lib/reports/schedule'
import { deliverSchedule } from '@/lib/reports/deliver'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Daily delivery window (Vercel cron 02:30 UTC = 08:00 IST). Each schedule
// runs with its creator's role scoping (see deliverSchedule).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ist = nowInIst()
  const schedules = await prisma.reportSchedule.findMany({
    where: { enabled: true, channel: 'email' }
  })
  const due = schedules.filter(s => cadenceDueToday(s.cadence, ist))

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const schedule of due) {
    const result = await deliverSchedule(prisma, schedule)
    if (result.status === 'sent') sent += result.sent
    else if (result.status === 'skipped') skipped++
    else if (errors.length < 10) errors.push(`${schedule.id}: ${result.error}`)
  }

  return NextResponse.json({ due: due.length, sent, skipped, errors })
}
