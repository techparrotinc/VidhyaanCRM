import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { LeadStatus, PaymentStatus, InvoiceStatus } from '@prisma/client'
import { redis } from '@/lib/redis'

export const GET = route({
  handler: async ({ db, user, org }) => {
    const orgId = user.orgId
    const cacheKey = `dashboard:summary:${orgId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return ok(JSON.parse(cached))
    }

    const now = new Date()
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    )
    const next7Days = new Date(
      now.getTime() +
      7 * 24 * 60 * 60 * 1000
    )
    const last7Days = new Date(
      now.getTime() -
      7 * 24 * 60 * 60 * 1000
    )
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalLeads,
      newLeads,
      leadsByStatus,
      totalAdmissions,
      admissionsByStage,
      admittedCount,
      feeCollectedThisMonth,
      feeOverdue,
      feeUpcoming,
      recentActivities,
      upcomingFollowUps,
      allStages,
      school,
      viewsThisWeek,
      upcomingEvents,
      leadsCreatedThisMonth,
      leadsCreatedLastMonth,
      leadsCreatedToday,
      convertedThisMonth,
      convertedLastMonth,
      feeCollectedLastMonth,
      admittedThisMonth,
      decidedAdmissions
    ] = await Promise.all([

      // Total leads
      db.lead.count({
        where: {
          orgId,
          deletedAt: null
        }
      }),

      // New leads this month
      db.lead.count({
        where: {
          orgId,
          status: LeadStatus.NEW,
          deletedAt: null,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Leads by status
      db.lead.groupBy({
        by: ['status'],
        where: {
          orgId,
          deletedAt: null
        },
        _count: { status: true }
      }),

      // Total admissions
      db.admission.count({
        where: {
          orgId,
          deletedAt: null
        }
      }),

      // Admissions by stage
      db.admission.groupBy({
        by: ['stageId'],
        where: {
          orgId,
          deletedAt: null
        },
        _count: { stageId: true }
      }),

      // Admitted count
      db.admission.count({
        where: {
          orgId,
          status: 'ADMITTED',
          deletedAt: null
        }
      }),

      // Fee collected this month
      db.payment.aggregate({
        where: {
          orgId,
          status: PaymentStatus.SUCCESS,
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { amount: true }
      }),

      // Fee overdue
      db.invoice.aggregate({
        where: {
          orgId,
          status: InvoiceStatus.OVERDUE,
          deletedAt: null
        },
        _sum: { totalAmount: true }
      }),

      // Fee upcoming (next 7 days)
      db.invoice.aggregate({
        where: {
          orgId,
          status: InvoiceStatus.UNPAID,
          dueDate: {
            gte: now,
            lte: next7Days
          },
          deletedAt: null
        },
        _sum: { totalAmount: true }
      }),

      // Recent activities (last 5)
      db.leadActivity.findMany({
        where: {
          orgId
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          lead: {
            select: {
              id: true,
              parentName: true,
              leadCode: true
            }
          }
        }
      }),

      // Upcoming follow-ups
      db.lead.findMany({
        where: {
          orgId,
          deletedAt: null,
          nextFollowUpAt: {
            lte: now
          },
          status: {
            notIn: [LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED]
          }
        },
        orderBy: {
          nextFollowUpAt: 'asc'
        },
        take: 5,
        select: {
          id: true,
          parentName: true,
          leadCode: true,
          phone: true,
          status: true,
          priority: true,
          nextFollowUpAt: true,
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Get all active stages
      db.admissionStage.findMany({
        select: {
          id: true,
          name: true,
          color: true
        }
      }),

      // Marketplace profile views (School/SchoolView are not tenant-scoped
      // models — filter by orgId explicitly)
      db.school.findFirst({
        where: { orgId, deletedAt: null },
        select: { viewCount: true }
      }),
      db.schoolView.count({
        where: {
          school: { orgId },
          createdAt: { gte: last7Days }
        }
      }),

      // Next 3 upcoming published events
      db.event.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }]
        },
        orderBy: { startsAt: 'asc' },
        take: 3,
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
          location: true,
          _count: { select: { rsvps: true } }
        }
      }),

      // Month-over-month comparisons (true intake: any status)
      db.lead.count({
        where: { deletedAt: null, createdAt: { gte: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, createdAt: { gte: startOfToday } }
      }),
      // CONVERTED transition timestamp isn't stored; updatedAt is the best proxy
      db.lead.count({
        where: { deletedAt: null, status: LeadStatus.CONVERTED, updatedAt: { gte: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, status: LeadStatus.CONVERTED, updatedAt: { gte: startOfLastMonth, lt: startOfMonth } }
      }),
      db.payment.aggregate({
        where: {
          orgId,
          status: PaymentStatus.SUCCESS,
          paidAt: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { amount: true }
      }),
      db.admission.count({
        where: { deletedAt: null, status: 'ADMITTED', updatedAt: { gte: startOfMonth } }
      }),
      // decided admissions since last month → avg convert time per month
      db.admission.findMany({
        where: { deletedAt: null, decidedAt: { not: null, gte: startOfLastMonth } },
        select: { createdAt: true, decidedAt: true },
        take: 1000
      })
    ])

    const admissionsByStageWithLabel =
      admissionsByStage.map(a => {
        const stage = allStages.find(s => s.id === a.stageId)
        return {
          stageId: a.stageId,
          count: a._count.stageId,
          stage: stage
            ? {
                id: stage.id,
                label: stage.name,
                color: stage.color
              }
            : null
        }
      })

    const avgDays = (rows: { createdAt: Date; decidedAt: Date | null }[]) => {
      if (rows.length === 0) return null
      const totalMs = rows.reduce((sum, a) => sum + (new Date(a.decidedAt!).getTime() - new Date(a.createdAt).getTime()), 0)
      return Math.round(totalMs / rows.length / (24 * 60 * 60 * 1000))
    }
    const decidedThisMonth = decidedAdmissions.filter(a => new Date(a.decidedAt!) >= startOfMonth)
    const decidedLastMonth = decidedAdmissions.filter(a => new Date(a.decidedAt!) < startOfMonth)

    const conversionRate = totalAdmissions > 0
      ? Math.round(
          (admittedCount / totalAdmissions)
          * 100
        )
      : 0

    const result = {
      leads: {
        total: totalLeads,
        new: newLeads,
        byStatus: leadsByStatus.map(l => ({
          status: l.status,
          count: l._count.status
        })),
        cap: org.leadCap,
        capUsed: totalLeads,
        createdThisMonth: leadsCreatedThisMonth,
        createdToday: leadsCreatedToday
      },
      comparisons: {
        enquiries: { current: leadsCreatedThisMonth, previous: leadsCreatedLastMonth },
        converted: { current: convertedThisMonth, previous: convertedLastMonth },
        avgConvertDays: {
          current: avgDays(decidedThisMonth),
          previous: avgDays(decidedLastMonth)
        },
        admittedThisMonth
      },
      admissions: {
        total: totalAdmissions,
        byStage: admissionsByStageWithLabel,
        conversionRate,
        admitted: admittedCount
      },
      fees: {
        collectedThisMonth:
          feeCollectedThisMonth._sum.amount
          ?? 0,
        collectedLastMonth:
          feeCollectedLastMonth._sum.amount ?? 0,
        overdue:
          feeOverdue._sum.totalAmount ?? 0,
        upcoming:
          feeUpcoming._sum.totalAmount ?? 0
      },
      profile: {
        views: school?.viewCount ?? 0,
        viewsThisWeek
      },
      upcomingEvents,
      recentActivity: recentActivities,
      upcomingFollowUps
    }

    // 5 min cache: the summary is 13 aggregate queries; a short TTL meant the
    // KPI row re-ran them (and rendered last) on almost every visit.
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
    return ok(result)
  }
})
