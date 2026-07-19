import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { prisma } from '@/lib/db/client'
import { cleanPhoneNumber } from '@/lib/utils'
import { toDbDate, dbDateToString } from '@/lib/attendance/dates'
import { istTodayString, resolveHolidaySettings } from '@/lib/holidays/national'
import { sendTemplateNotification } from '@/lib/whatsapp/notify'

// Holiday-morning WhatsApp wishes to guardians. Runs daily 08:30 IST.
// Triple opt-in: org has the greeting enabled (Settings → Attendance →
// Holidays), the WhatsApp add-on is on, and the org adopted the
// `holiday_announcement` template — sendTemplateNotification enforces the
// last two per send. Idempotent via settings.holidays.greetingSentOn.

const TEMPLATE = 'holiday_announcement'
const MAX_RECIPIENTS_PER_ORG = 1000
const CHUNK = 20
const ACTIVE_ORG_STATUSES = ['ACTIVE', 'TRIAL'] as const

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const today = istTodayString()
    const yesterday = shiftDay(today, -1)

    const todaysHolidays = await prisma.holiday.findMany({
      where: { date: toDbDate(today) },
      select: {
        orgId: true,
        name: true,
        message: true,
        organization: {
          select: { name: true, status: true, settings: true, institutionType: true, deletedAt: true }
        }
      }
    })

    const summary: Array<{ orgId: string; holiday: string; sent: number; skipped?: string }> = []

    for (const h of todaysHolidays) {
      const org = h.organization
      const base = { orgId: h.orgId, holiday: h.name, sent: 0 }
      if (org.deletedAt || !ACTIVE_ORG_STATUSES.includes(org.status as any)) {
        summary.push({ ...base, skipped: 'org inactive' })
        continue
      }
      const hs = resolveHolidaySettings(org.settings, org.institutionType)
      if (!hs.greetingEnabled) {
        summary.push({ ...base, skipped: 'greeting disabled' })
        continue
      }
      // Mid-range day of a multi-day break → greeted on day one already
      const prevDay = await prisma.holiday.findFirst({
        where: { orgId: h.orgId, name: h.name, date: toDbDate(yesterday) },
        select: { id: true }
      })
      if (prevDay) {
        summary.push({ ...base, skipped: 'mid-range day' })
        continue
      }
      // Idempotency across cron re-runs
      if ((org.settings as any)?.holidays?.greetingSentOn === today) {
        summary.push({ ...base, skipped: 'already sent today' })
        continue
      }
      // Template adopted? Cheap pre-check so we skip loading students.
      const adopted = await prisma.whatsappTemplate.findFirst({
        where: {
          orgId: h.orgId,
          msg91TemplateId: TEMPLATE,
          status: { in: ['VERIFIED', 'SYNCED'] },
          deletedAt: null
        },
        select: { id: true }
      })
      if (!adopted) {
        summary.push({ ...base, skipped: 'template not adopted' })
        continue
      }

      // Resume date = day after the last consecutive same-name holiday
      const upcoming = await prisma.holiday.findMany({
        where: {
          orgId: h.orgId,
          name: h.name,
          date: { gte: toDbDate(today), lte: toDbDate(shiftDay(today, 14)) }
        },
        orderBy: { date: 'asc' },
        select: { date: true }
      })
      let endDate = today
      for (const row of upcoming) {
        const d = dbDateToString(row.date)
        if (d === endDate || d === shiftDay(endDate, 1)) endDate = d
        else break
      }
      const resumeDate = format(new Date(`${shiftDay(endDate, 1)}T00:00:00`), 'd MMM yyyy')

      const students = await prisma.student.findMany({
        where: {
          orgId: h.orgId,
          status: 'ACTIVE',
          deletedAt: null,
          guardianPhone: { not: null }
        },
        select: { guardianName: true, guardianPhone: true },
        take: MAX_RECIPIENTS_PER_ORG * 2
      })
      const seen = new Set<string>()
      const recipients: { name: string; phone: string }[] = []
      for (const s of students) {
        const phone = (cleanPhoneNumber(s.guardianPhone ?? '') as string) || ''
        if (!phone || phone.length < 10 || seen.has(phone)) continue
        seen.add(phone)
        recipients.push({ name: s.guardianName || 'Parent', phone })
        if (recipients.length >= MAX_RECIPIENTS_PER_ORG) break
      }

      let sent = 0
      for (let i = 0; i < recipients.length; i += CHUNK) {
        const chunk = recipients.slice(i, i + CHUNK)
        const results = await Promise.allSettled(
          chunk.map(r =>
            sendTemplateNotification({
              orgId: h.orgId,
              phone: r.phone,
              template: TEMPLATE,
              ref: `holiday_greet:${h.orgId}:${today}`,
              values: {
                parentName: r.name,
                schoolName: org.name,
                reason: h.message || h.name,
                holiday: h.name,
                date: format(new Date(`${today}T00:00:00`), 'd MMM yyyy'),
                resumeDate
              }
            })
          )
        )
        sent += results.filter(r => r.status === 'fulfilled' && r.value === true).length
      }

      // Stamp settings so a cron re-run the same day never double-sends
      const fresh = await prisma.organization.findUnique({
        where: { id: h.orgId },
        select: { settings: true }
      })
      const settings = (fresh?.settings as any) || {}
      await prisma.organization.update({
        where: { id: h.orgId },
        data: {
          settings: {
            ...settings,
            holidays: { ...(settings.holidays ?? {}), greetingSentOn: today }
          }
        }
      })

      summary.push({ ...base, sent })
    }

    return NextResponse.json({ success: true, today, orgs: summary })
  } catch (err) {
    console.error('holiday-greetings cron:', err)
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 })
  }
}

function shiftDay(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}
