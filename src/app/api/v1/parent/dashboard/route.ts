import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { computeStats } from '@/lib/attendance/stats'
import {
  buildSchedule,
  currentClassOf,
  istDateString,
  istTimeString,
  toWardLite,
  wardSelect,
  type ScheduleItem
} from '@/lib/parent-schedule'

interface Reminder {
  type: string
  severity: 'INFO' | 'WARN' | 'URGENT'
  title: string
  detail: string | null
  href: string
  /** null = not tied to one org (always visible under an org filter) */
  orgId: string | null
}

/**
 * Parent landing dashboard. Persona-aware payload:
 *  - ENROLLED (linked wards): schedule, reminders, current class, attendance,
 *    fees due, notifications, organisations.
 *  - DISCOVERY (no wards): the original marketplace widgets.
 */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parentId = parent.id
    const parentCity = parent.city || 'Chennai'
    const todayIst = istDateString()
    const nowHHmm = istTimeString()

    // 7-day IST window starting today
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${todayIst}T00:00:00.000Z`)
      d.setUTCDate(d.getUTCDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }

    const wardsRaw = await prisma.student.findMany({
      where: { ...linkedStudentsWhere(parent), status: 'ACTIVE' },
      select: wardSelect
    })
    const wards = wardsRaw.map(toWardLite)
    const wardIds = wards.map((w) => w.id)

    // Month window (UTC approximation is fine for attendance @db.Date rows)
    const monthStart = new Date(`${todayIst.slice(0, 7)}-01T00:00:00.000Z`)

    const [
      schedule,
      attendanceRecords,
      dueInvoices,
      notifications,
      unreadCount,
      trialBookings,
      totalEnquiries,
      totalBookmarks,
      activeApplications,
      kidsCount,
      admittedApplications,
      recentEnquiries,
      recentApplications,
      recommendedSchools
    ] = await Promise.all([
      buildSchedule(wards, dates),

      wardIds.length
        ? prisma.attendanceRecord.findMany({
            where: { studentId: { in: wardIds }, date: { gte: monthStart } },
            select: { studentId: true, status: true }
          })
        : Promise.resolve([]),

      wardIds.length
        ? prisma.invoice.findMany({
            where: {
              studentId: { in: wardIds },
              deletedAt: null,
              status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] }
            },
            orderBy: { dueDate: 'asc' },
            select: {
              id: true,
              invoiceNumber: true,
              dueDate: true,
              totalAmount: true,
              paidAmount: true,
              status: true,
              student: { select: { id: true, name: true } }
            }
          })
        : Promise.resolve([]),

      prisma.notification.findMany({
        where: { recipientType: 'PARENT', recipientId: parentId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, body: true, readAt: true, createdAt: true }
      }),

      prisma.notification.count({
        where: { recipientType: 'PARENT', recipientId: parentId, deletedAt: null, readAt: null }
      }),

      prisma.trialClassBooking.findMany({
        where: {
          phone: parent.phone,
          status: { in: ['PENDING', 'CONFIRMED'] },
          preferredDate: { gte: new Date() }
        },
        orderBy: { preferredDate: 'asc' },
        take: 3,
        select: {
          id: true,
          orgId: true,
          childName: true,
          preferredDate: true,
          status: true,
          school: { select: { name: true } }
        }
      }),

      prisma.parentEnquiry.count({ where: { parentId } }),
      prisma.parentBookmark.count({ where: { parentId } }),
      prisma.parentApplication.count({
        where: { parentId, status: { notIn: ['REJECTED', 'WITHDRAWN'] } }
      }),
      prisma.kidProfile.count({ where: { parentId, deletedAt: null } }),
      prisma.parentApplication.count({ where: { parentId, status: 'ADMITTED' } }),

      prisma.parentEnquiry.findMany({
        where: { parentId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: { orderBy: { sortOrder: 'asc' }, take: 1 },
              locations: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      }),

      prisma.parentApplication.findMany({
        where: { parentId },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: { orderBy: { sortOrder: 'asc' }, take: 1 },
              locations: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      }),

      prisma.school.findMany({
        where: {
          isPublished: true,
          locations: { some: { city: { equals: parentCity, mode: 'insensitive' } } }
        },
        include: {
          locations: true,
          affiliations: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 }
        },
        take: 3
      })
    ])

    // Per-ward attendance stats (current month)
    const attendance = wards.map((w) => ({
      studentId: w.id,
      studentName: w.name,
      ...computeStats(
        attendanceRecords.filter((r) => r.studentId === w.id).map((r) => r.status)
      )
    }))

    // Current class per ward, from today's merged schedule
    const currentClasses = wards
      .map((w) => ({ studentId: w.id, slot: currentClassOf(schedule, w.id, todayIst, nowHHmm) }))
      .filter((c) => c.slot !== null)

    // Fees summary
    const totalBalance = dueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    )

    // Derived reminders — no Reminder model; everything is computable
    const wardOrgById = new Map(wards.map((w) => [w.id, w.orgId]))
    const reminders: Reminder[] = []
    // IST calendar-day compare: an invoice due today is "due", not "overdue".
    const in7daysStr = dates[dates.length - 1]
    for (const inv of dueInvoices) {
      if (!inv.dueDate) continue
      const dueStr = istDateString(inv.dueDate)
      const balance = Number(inv.totalAmount) - Number(inv.paidAmount)
      if (dueStr < todayIst) {
        reminders.push({
          type: 'FEE_OVERDUE',
          severity: 'URGENT',
          title: `Fee overdue for ${inv.student.name}`,
          detail: `${inv.invoiceNumber} · ₹${balance.toLocaleString('en-IN')} outstanding`,
          href: '/parent/fees',
          orgId: wardOrgById.get(inv.student.id) ?? null
        })
      } else if (dueStr <= in7daysStr) {
        reminders.push({
          type: 'FEE_DUE_SOON',
          severity: 'WARN',
          title: `Fee due ${dueStr} for ${inv.student.name}`,
          detail: `${inv.invoiceNumber} · ₹${balance.toLocaleString('en-IN')}`,
          href: '/parent/fees',
          orgId: wardOrgById.get(inv.student.id) ?? null
        })
      }
    }
    for (const t of trialBookings) {
      reminders.push({
        type: 'TRIAL_CLASS',
        severity: 'INFO',
        title: `Trial class for ${t.childName} at ${t.school.name}`,
        detail: t.preferredDate ? `Preferred date ${istDateString(t.preferredDate)} · ${t.status}` : t.status,
        href: '/parent/applications',
        orgId: t.orgId
      })
    }
    const soonEvents = schedule.filter(
      (i) => i.type === 'EVENT' && (i.date === dates[0] || i.date === dates[1])
    )
    for (const e of soonEvents.slice(0, 2)) {
      reminders.push({
        type: 'EVENT_SOON',
        severity: 'INFO',
        title: `Upcoming: ${e.title}`,
        detail: `${e.date} ${e.startTime ?? ''} · ${e.orgName ?? ''}`.trim(),
        href: '/parent/events',
        orgId: e.orgId
      })
    }
    if (!parent.email) {
      reminders.push({
        type: 'PROFILE_INCOMPLETE',
        severity: 'INFO',
        title: 'Add your email address',
        detail: 'Get fee receipts and event updates by email',
        href: '/parent/profile',
        orgId: null
      })
    }
    const severityRank = { URGENT: 0, WARN: 1, INFO: 2 }
    reminders.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

    // Distinct organisations across wards
    const orgMap = new Map<string, { orgId: string; name: string; wardCount: number }>()
    for (const w of wards) {
      const entry = orgMap.get(w.orgId) ?? { orgId: w.orgId, name: w.orgName, wardCount: 0 }
      entry.wardCount++
      orgMap.set(w.orgId, entry)
    }

    const scheduleToday: ScheduleItem[] = schedule.filter((i) => i.date === todayIst)

    return NextResponse.json({
      success: true,
      persona: wards.length > 0 ? 'ENROLLED' : 'DISCOVERY',
      parent: {
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        city: parent.city
      },
      wards: wards.map((w) => ({
        id: w.id,
        name: w.name,
        gradeLabel: w.gradeLabel,
        section: w.section,
        orgId: w.orgId,
        orgName: w.orgName,
        batchName: w.batch?.name ?? null
      })),
      organizations: [...orgMap.values()],
      scheduleToday,
      scheduleWeek: schedule,
      currentClasses,
      attendance,
      fees: {
        dueCount: dueInvoices.length,
        totalBalance,
        invoices: dueInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          studentId: inv.student.id,
          studentName: inv.student.name,
          balance: Number(inv.totalAmount) - Number(inv.paidAmount)
        })),
        nextDue: dueInvoices[0]
          ? {
              invoiceNumber: dueInvoices[0].invoiceNumber,
              dueDate: dueInvoices[0].dueDate,
              studentName: dueInvoices[0].student.name,
              balance: Number(dueInvoices[0].totalAmount) - Number(dueInvoices[0].paidAmount)
            }
          : null
      },
      reminders,
      notifications: { unreadCount, items: notifications },
      stats: { totalEnquiries, totalBookmarks, activeApplications, kidsCount, admittedApplications },
      recentEnquiries,
      recentApplications,
      recommendedSchools
    })
  } catch (error: any) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
