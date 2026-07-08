import { prisma } from '@/lib/db/client'
import { ReportQuery, ReportCtx, Filters, rangeFilter, offsetCursor, nextOffsetCursor } from './types'

// Trial-class → enrolment funnel for learning centres. TrialClassBooking is
// marketplace-side, keyed to School — linked here through School.orgId
// (set when the org claims its profile). Conversion match: a CRM lead with
// the same phone created on/after the booking; "enrolled" when that lead is
// CONVERTED. Phone-based matching is honest-but-approximate; stated in UI.

async function orgSchoolIds(orgId: string): Promise<string[]> {
  const schools = await prisma.school.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true }
  })
  return schools.map(s => s.id)
}

function bookingWhere(schoolIds: string[], filters: Filters) {
  const range = rangeFilter(filters)
  return {
    schoolId: { in: schoolIds },
    ...(range ? { createdAt: range } : {}),
    ...(filters.status ? { status: filters.status } : {})
  }
}

async function bookingsWithMatches(ctx: ReportCtx, filters: Filters) {
  const schoolIds = await orgSchoolIds(ctx.orgId)
  if (schoolIds.length === 0) return { bookings: [], leadByPhone: new Map<string, { status: string; createdAt: Date }[]>() }

  const bookings = await prisma.trialClassBooking.findMany({
    where: bookingWhere(schoolIds, filters),
    select: {
      id: true, parentName: true, childName: true, childAge: true, phone: true,
      preferredDate: true, activityType: true, status: true,
      confirmedAt: true, createdAt: true,
      batchSchedule: { select: { id: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 2000
  })

  const phones = [...new Set(bookings.map(b => b.phone))]
  const leads = phones.length
    ? await ctx.db.lead.findMany({
        where: { phone: { in: phones } },
        select: { phone: true, status: true, createdAt: true }
      })
    : []
  const leadByPhone = new Map<string, { status: string; createdAt: Date }[]>()
  for (const l of leads) {
    const list = leadByPhone.get(l.phone) ?? []
    list.push({ status: l.status as string, createdAt: l.createdAt })
    leadByPhone.set(l.phone, list)
  }
  return { bookings, leadByPhone }
}

function matchOutcome(
  booking: { phone: string; createdAt: Date },
  leadByPhone: Map<string, { status: string; createdAt: Date }[]>
): 'ENROLLED' | 'LEAD' | 'NO_LEAD' {
  const matches = (leadByPhone.get(booking.phone) ?? []).filter(
    // small grace window: lead may have been logged just before the booking
    l => l.createdAt.getTime() >= booking.createdAt.getTime() - 7 * 864e5
  )
  if (matches.length === 0) return 'NO_LEAD'
  return matches.some(l => l.status === 'CONVERTED') ? 'ENROLLED' : 'LEAD'
}

export const trialClassConversion: ReportQuery = {
  async summary(ctx, filters) {
    const { bookings, leadByPhone } = await bookingsWithMatches(ctx, filters)

    let confirmed = 0
    let cancelled = 0
    let enrolled = 0
    let becameLead = 0
    const byActivity = new Map<string, { trials: number; enrolled: number }>()

    for (const b of bookings) {
      if (b.status === 'CONFIRMED' || b.confirmedAt) confirmed++
      if (b.status === 'CANCELLED') cancelled++
      const outcome = matchOutcome(b, leadByPhone)
      if (outcome === 'ENROLLED') enrolled++
      if (outcome !== 'NO_LEAD') becameLead++
      const act = b.activityType ?? 'General'
      const e = byActivity.get(act) ?? { trials: 0, enrolled: 0 }
      e.trials++
      if (outcome === 'ENROLLED') e.enrolled++
      byActivity.set(act, e)
    }

    const total = bookings.length
    const best = [...byActivity.entries()]
      .filter(([, v]) => v.trials >= 5 && v.enrolled > 0)
      .sort((a, b) => b[1].enrolled / b[1].trials - a[1].enrolled / a[1].trials)[0]

    return {
      kpis: [
        { key: 'trials', label: 'Trial Bookings', value: total, format: 'int' },
        { key: 'confirmed', label: 'Confirmed', value: confirmed, format: 'int' },
        { key: 'cancelled', label: 'Cancelled', value: cancelled, format: 'int' },
        { key: 'becameLead', label: 'Became Leads', value: total > 0 ? becameLead / total : null, format: 'pct', caption: 'matched by phone' },
        { key: 'enrolled', label: 'Enrolled', value: total > 0 ? enrolled / total : null, format: 'pct', caption: `${enrolled} students` }
      ],
      insight: best
        ? `"${best[0]}" trials convert best (${Math.round((best[1].enrolled / best[1].trials) * 100)}% enrol) — add more slots there.`
        : total > 0 && enrolled === 0
          ? 'Trials are happening but none enrolled yet — check follow-up after the trial class.'
          : null,
      charts: {
        byActivity: [...byActivity.entries()].map(([activity, v]) => ({
          activity,
          trials: v.trials,
          enrolled: v.enrolled
        }))
      }
    }
  },

  async rows(ctx, filters, cursor, limit) {
    const offset = offsetCursor(cursor)
    const { bookings, leadByPhone } = await bookingsWithMatches(ctx, filters)
    const page = bookings.slice(offset, offset + limit)

    return {
      columns: [
        { key: 'createdAt', label: 'Booked', format: 'date' },
        { key: 'parentName', label: 'Parent' },
        { key: 'childName', label: 'Child' },
        { key: 'activityType', label: 'Activity', format: 'badge' },
        { key: 'preferredDate', label: 'Trial Date', format: 'date' },
        { key: 'status', label: 'Booking Status', format: 'badge' },
        { key: 'outcome', label: 'Outcome', format: 'badge' },
        { key: 'phone', label: 'Phone' }
      ],
      rows: page.map(b => ({
        createdAt: b.createdAt,
        parentName: b.parentName,
        childName: b.childName,
        activityType: b.activityType ?? '',
        preferredDate: b.preferredDate,
        status: b.status,
        outcome: matchOutcome(b, leadByPhone).replace(/_/g, ' '),
        phone: b.phone
      })),
      nextCursor: nextOffsetCursor(offset, limit, page.length)
    }
  }
}
