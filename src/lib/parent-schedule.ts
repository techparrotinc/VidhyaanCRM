import { prisma } from '@/lib/db/client'
import type { Prisma } from '@prisma/client'

/**
 * Parent-portal schedule aggregation. Merges, per linked ward:
 *  - school timetable slots (TimetableSlot, weekly recurring)
 *  - learning-centre batch times (StudentBatch daysOfWeek/startTime/endTime)
 *  - published org events
 *  - invoice due dates (all-day items)
 * All "day" math is IST — the product convention (see reports rollups).
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export function istNow(): Date {
  return new Date(Date.now() + IST_OFFSET_MS)
}

/** IST calendar date string YYYY-MM-DD. */
export function istDateString(d: Date = new Date()): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** Current IST wall-clock time as HH:mm. */
export function istTimeString(d: Date = new Date()): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(11, 16)
}

/** ISO day-of-week (1=Mon..7=Sun) of an IST calendar date string. */
export function isoDayOfWeek(dateStr: string): number {
  const dow = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay() // 0=Sun
  return dow === 0 ? 7 : dow
}

const BATCH_DAY_TO_ISO: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7
}

export interface WardLite {
  id: string
  name: string
  orgId: string
  gradeLabel: string | null
  section: string | null
  orgName: string
  batch: {
    name: string
    daysOfWeek: string[]
    startTime: string | null
    endTime: string | null
  } | null
}

export interface ScheduleItem {
  type: 'CLASS' | 'BATCH' | 'EVENT' | 'FEE_DUE'
  date: string // IST YYYY-MM-DD
  startTime: string | null // HH:mm, null = all-day
  endTime: string | null
  title: string
  subtitle: string | null
  studentId: string | null
  studentName: string | null
  orgId: string | null
  orgName: string | null
  href: string | null
}

export const wardSelect = {
  id: true,
  name: true,
  orgId: true,
  gradeLabel: true,
  section: true,
  organization: { select: { name: true, institutionType: true } },
  batch: { select: { name: true, daysOfWeek: true, startTime: true, endTime: true } }
} satisfies Prisma.StudentSelect

type WardRow = Prisma.StudentGetPayload<{ select: typeof wardSelect }>

export function toWardLite(s: WardRow): WardLite {
  return {
    id: s.id,
    name: s.name,
    orgId: s.orgId,
    gradeLabel: s.gradeLabel,
    section: s.section,
    orgName: s.organization.name,
    batch: s.batch
  }
}

/** Timetable slots visible to a ward (their section + whole-class slots). */
export async function fetchWardTimetableSlots(wards: WardLite[]) {
  const withGrade = wards.filter((w) => w.gradeLabel)
  if (withGrade.length === 0) return new Map<string, Awaited<ReturnType<typeof querySlots>>>()
  const results = await Promise.all(withGrade.map((w) => querySlots(w)))
  const map = new Map<string, (typeof results)[number]>()
  withGrade.forEach((w, i) => map.set(w.id, results[i]))
  return map
}

function querySlots(w: WardLite) {
  return prisma.timetableSlot.findMany({
    where: {
      orgId: w.orgId, // explicit org scoping — parent routes use the base client
      gradeLabel: w.gradeLabel!,
      sectionKey: { in: [w.section ?? 'ALL', 'ALL'] }
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      subject: true,
      room: true,
      teacher: { select: { name: true } }
    }
  })
}

/**
 * Build the merged schedule for the IST dates in `dates` (YYYY-MM-DD, ascending).
 * Events and fee due dates are fetched inside; timetable slots are passed in so
 * dashboard and timetable page share one query path.
 */
export async function buildSchedule(
  wards: WardLite[],
  dates: string[]
): Promise<ScheduleItem[]> {
  if (wards.length === 0 || dates.length === 0) return []

  const orgIds = [...new Set(wards.map((w) => w.orgId))]
  const windowStart = new Date(new Date(`${dates[0]}T00:00:00.000Z`).getTime() - IST_OFFSET_MS)
  const windowEnd = new Date(
    new Date(`${dates[dates.length - 1]}T00:00:00.000Z`).getTime() - IST_OFFSET_MS + 24 * 60 * 60 * 1000
  )

  const [slotMap, events, invoices] = await Promise.all([
    fetchWardTimetableSlots(wards),
    prisma.event.findMany({
      where: {
        orgId: { in: orgIds },
        status: 'PUBLISHED',
        deletedAt: null,
        startsAt: { gte: windowStart, lt: windowEnd }
      },
      orderBy: { startsAt: 'asc' },
      take: 30,
      select: {
        id: true,
        title: true,
        location: true,
        startsAt: true,
        endsAt: true,
        orgId: true,
        organization: { select: { name: true } }
      }
    }),
    prisma.invoice.findMany({
      where: {
        studentId: { in: wards.map((w) => w.id) },
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { gte: windowStart, lt: windowEnd }
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        studentId: true,
        student: { select: { name: true } }
      }
    })
  ])

  const items: ScheduleItem[] = []

  for (const date of dates) {
    const isoDow = isoDayOfWeek(date)

    for (const ward of wards) {
      // School timetable
      for (const slot of slotMap.get(ward.id) ?? []) {
        if (slot.dayOfWeek !== isoDow) continue
        items.push({
          type: 'CLASS',
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: slot.subject,
          subtitle: [slot.teacher?.name, slot.room].filter(Boolean).join(' · ') || null,
          studentId: ward.id,
          studentName: ward.name,
          orgId: ward.orgId,
          orgName: ward.orgName,
          href: '/parent/timetable'
        })
      }
      // Learning-centre batch
      const b = ward.batch
      if (b?.startTime && b.daysOfWeek.some((d) => BATCH_DAY_TO_ISO[d] === isoDow)) {
        items.push({
          type: 'BATCH',
          date,
          startTime: b.startTime,
          endTime: b.endTime,
          title: b.name,
          subtitle: 'Batch class',
          studentId: ward.id,
          studentName: ward.name,
          orgId: ward.orgId,
          orgName: ward.orgName,
          href: '/parent/timetable'
        })
      }
    }
  }

  for (const e of events) {
    items.push({
      type: 'EVENT',
      date: istDateString(e.startsAt),
      startTime: istTimeString(e.startsAt),
      endTime: e.endsAt ? istTimeString(e.endsAt) : null,
      title: e.title,
      subtitle: e.location || 'Event',
      studentId: null,
      studentName: null,
      orgId: e.orgId,
      orgName: e.organization.name,
      href: '/parent/events'
    })
  }

  const wardOrg = new Map(wards.map((w) => [w.id, w.orgId]))
  for (const inv of invoices) {
    const balance = Number(inv.totalAmount) - Number(inv.paidAmount)
    items.push({
      type: 'FEE_DUE',
      date: istDateString(inv.dueDate!),
      startTime: null,
      endTime: null,
      title: `Fee due — ${inv.invoiceNumber}`,
      subtitle: `₹${balance.toLocaleString('en-IN')} balance`,
      studentId: inv.studentId,
      studentName: inv.student.name,
      orgId: wardOrg.get(inv.studentId) ?? null,
      orgName: null,
      href: '/parent/fees'
    })
  }

  items.sort((a, b) =>
    a.date === b.date
      ? (a.startTime ?? '00:00').localeCompare(b.startTime ?? '00:00')
      : a.date.localeCompare(b.date)
  )
  return items
}

/** Slot the ward is sitting in right now (IST), if any. */
export function currentClassOf(
  items: ScheduleItem[],
  studentId: string,
  todayIst: string,
  nowHHmm: string
): ScheduleItem | null {
  return (
    items.find(
      (i) =>
        (i.type === 'CLASS' || i.type === 'BATCH') &&
        i.studentId === studentId &&
        i.date === todayIst &&
        i.startTime !== null &&
        i.startTime <= nowHHmm &&
        (i.endTime ?? '23:59') > nowHHmm
    ) ?? null
  )
}
