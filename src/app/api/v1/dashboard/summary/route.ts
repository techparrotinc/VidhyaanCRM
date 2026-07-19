import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { LeadStatus, PaymentStatus, InvoiceStatus } from '@prisma/client'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { buildExecutiveAttention } from '@/lib/reports/insights'
import { OPEN_LEAD_STATUSES, OPEN_INVOICE_STATUSES } from '@/lib/reports/queries/scope'

export const GET = route({
  handler: async ({ req, db, user, org }) => {
    const orgId = user.orgId
    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    // v4: adds leads.followUpsDueToday + fees.collectedToday + attention strip
    const cacheKey = `dashboard:summary:v4:${orgId}:${academicYearId || 'all'}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return ok(JSON.parse(cached))
    }

    // Scope KPI queries to the selected academic year; legacy records with
    // no AY stamp show under every year (matches the list routes)
    const ayScope = academicYearId
      ? { AND: [{ OR: [{ academicYearId }, { academicYearId: null }] }] }
      : {}
    // Payments are mostly unstamped — scope them through their invoice's
    // year (invoices are reliably stamped) instead of their own field
    const paymentAyScope = academicYearId
      ? { invoice: { OR: [{ academicYearId }, { academicYearId: null }] } }
      : {}

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
    // Attention-strip windows — same definitions as the executive dashboard
    const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const d14Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const d60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Overdue must be derived, not read from the stored status: the
    // UNPAID→OVERDUE flip only happens when the fee-management page is
    // visited, so stored status lags reality. PARTIALLY_PAID still owes too.
    const overdueWhere = {
      OR: [
        { status: InvoiceStatus.OVERDUE },
        {
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID] },
          dueDate: { lt: now }
        }
      ]
    }
    const dueSoonWhere = {
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID] },
      dueDate: { gte: now, lte: next7Days }
    }

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
      decidedAdmissions,
      leadsCreatedThisWeek,
      leadsBySource,
      unassignedLeadCount,
      enrolledStudents,
      paidStudentRows,
      overdueStudentRows,
      dueSoonStudentRows,
      oldestOverdueInvoice,
      upcomingInvoiceCount,
      totalCollectedAgg,
      lastPaymentRow,
      overdueOutstandingAgg,
      eventsThisMonthCount,
      orgMeta,
      orgModuleRows,
      followUpsDueTodayCount,
      collectedTodayAgg,
      uncontacted48h,
      overdue60Agg,
      stuckAdmissions
    ] = await Promise.all([

      // Total leads
      db.lead.count({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope
        }
      }),

      // New leads this month
      db.lead.count({
        where: {
          orgId,
          status: LeadStatus.NEW,
          deletedAt: null,
          ...ayScope,
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
          deletedAt: null,
          ...ayScope
        },
        _count: { status: true }
      }),

      // Total admissions
      db.admission.count({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope
        }
      }),

      // Admissions by stage
      db.admission.groupBy({
        by: ['stageId'],
        where: {
          orgId,
          deletedAt: null,
          ...ayScope
        },
        _count: { stageId: true }
      }),

      // Admitted count
      db.admission.count({
        where: {
          orgId,
          status: 'ADMITTED',
          deletedAt: null,
          ...ayScope
        }
      }),

      // Fee collected this month
      db.payment.aggregate({
        where: {
          orgId,
          status: PaymentStatus.SUCCESS,
          ...paymentAyScope,
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { amount: true }
      }),

      // Fee overdue (net of partial payments)
      db.invoice.aggregate({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope,
          ...overdueWhere
        },
        _sum: { totalAmount: true, paidAmount: true }
      }),

      // Fee upcoming (next 7 days, net of partial payments)
      db.invoice.aggregate({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope,
          ...dueSoonWhere
        },
        _sum: { totalAmount: true, paidAmount: true }
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
          ...ayScope,
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
        select: { viewCount: true, institutionType: true }
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
        where: { deletedAt: null, ...ayScope, createdAt: { gte: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, ...ayScope, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, ...ayScope, createdAt: { gte: startOfToday } }
      }),
      // CONVERTED transition timestamp isn't stored; updatedAt is the best proxy
      db.lead.count({
        where: { deletedAt: null, ...ayScope, status: LeadStatus.CONVERTED, updatedAt: { gte: startOfMonth } }
      }),
      db.lead.count({
        where: { deletedAt: null, ...ayScope, status: LeadStatus.CONVERTED, updatedAt: { gte: startOfLastMonth, lt: startOfMonth } }
      }),
      db.payment.aggregate({
        where: {
          orgId,
          status: PaymentStatus.SUCCESS,
          ...paymentAyScope,
          paidAt: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { amount: true }
      }),
      db.admission.count({
        where: { deletedAt: null, ...ayScope, status: 'ADMITTED', updatedAt: { gte: startOfMonth } }
      }),
      // decided admissions since last month → avg convert time per month
      db.admission.findMany({
        where: { deletedAt: null, ...ayScope, decidedAt: { not: null, gte: startOfLastMonth } },
        select: { createdAt: true, decidedAt: true },
        take: 1000
      }),

      // Lead overview: this week, source breakdown, unassigned nudge
      db.lead.count({
        where: { deletedAt: null, ...ayScope, createdAt: { gte: last7Days } }
      }),
      db.lead.groupBy({
        by: ['source'],
        where: { orgId, deletedAt: null, ...ayScope },
        _count: { source: true },
        orderBy: { _count: { source: 'desc' } }
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          ...ayScope,
          assignedToId: null,
          status: { notIn: [LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED] }
        }
      }),

      // Fee overview: per-student payment posture + YTD / last payment
      db.student.count({
        where: { deletedAt: null, status: 'ACTIVE', ...ayScope }
      }),
      db.invoice.findMany({
        where: { orgId, deletedAt: null, ...ayScope, status: InvoiceStatus.PAID },
        distinct: ['studentId'],
        select: { studentId: true }
      }),
      db.invoice.findMany({
        where: { orgId, deletedAt: null, ...ayScope, ...overdueWhere },
        distinct: ['studentId'],
        select: { studentId: true }
      }),
      db.invoice.findMany({
        where: { orgId, deletedAt: null, ...ayScope, ...dueSoonWhere },
        distinct: ['studentId'],
        select: { studentId: true }
      }),
      db.invoice.findFirst({
        where: { orgId, deletedAt: null, ...ayScope, ...overdueWhere },
        orderBy: { dueDate: 'asc' },
        select: { dueDate: true }
      }),
      db.invoice.count({
        where: { orgId, deletedAt: null, ...ayScope, ...dueSoonWhere }
      }),
      db.payment.aggregate({
        where: { orgId, status: PaymentStatus.SUCCESS, ...paymentAyScope },
        _sum: { amount: true }
      }),
      db.payment.findFirst({
        where: { orgId, status: PaymentStatus.SUCCESS, ...paymentAyScope },
        orderBy: { paidAt: 'desc' },
        select: {
          amount: true,
          paidAt: true,
          student: { select: { name: true } },
          invoice: { select: { student: { select: { name: true } } } }
        }
      }),
      db.invoice.aggregate({
        where: { orgId, deletedAt: null, ...ayScope, ...overdueWhere },
        _sum: { totalAmount: true, paidAmount: true }
      }),

      // Published events remaining this month (for the dashboard "+N more" line)
      db.event.count({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          startsAt: { gte: now, lte: endOfMonth }
        }
      }),

      // Org meta — plan + trial/grace state (drives plan-aware upsell + real countdown)
      db.organization.findUnique({
        where: { id: orgId },
        select: {
          status: true,
          trialEndsAt: true,
          plan: {
            select: {
              slug: true,
              name: true,
              monthlyPrice: true,
              planModules: { select: { moduleSlug: true } }
            }
          },
          subscriptions: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, graceEndsAt: true }
          }
        }
      }),

      // Explicitly enabled modules — gate premium badges by real entitlement
      db.organizationModule.findMany({
        where: { orgId, enabled: true },
        select: { module: { select: { slug: true } } }
      }),

      // Follow-ups due today (incl. already-overdue ones — the actionable queue)
      db.lead.count({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope,
          nextFollowUpAt: { lt: new Date(startOfToday.getTime() + 86400000) },
          status: { notIn: [LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED] }
        }
      }),

      // Fees collected today
      db.payment.aggregate({
        where: {
          orgId,
          status: PaymentStatus.SUCCESS,
          ...paymentAyScope,
          paidAt: { gte: startOfToday }
        },
        _sum: { amount: true }
      }),

      // Attention strip inputs (same rules as /reports/dashboards/executive)
      db.lead.count({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope,
          firstContactedAt: null,
          status: { in: [...OPEN_LEAD_STATUSES] },
          createdAt: { lt: h48Ago }
        }
      }),
      db.invoice.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: { in: [...OPEN_INVOICE_STATUSES] },
          dueDate: { lt: d60Ago }
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true }
      }),
      db.admission.count({
        where: {
          orgId,
          deletedAt: null,
          ...ayScope,
          status: 'IN_PROGRESS',
          updatedAt: { lt: d14Ago }
        }
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

    // Marketplace signals: latest parent reviews + fresh unactioned enquiries
    // (marketplace tables are org-scoped by orgId, not tenant-proxied)
    const [latestReviews, reviewsThisWeek, newEnquiries, pendingTrials, recentEnquiries] =
      await Promise.all([
        prisma.schoolReview.findMany({
          where: { orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            rating: true,
            title: true,
            status: true,
            isVerifiedAdmission: true,
            createdAt: true,
            parent: { select: { name: true } },
          },
        }),
        prisma.schoolReview.count({
          where: { orgId, deletedAt: null, createdAt: { gte: last7Days } },
        }),
        prisma.parentEnquiry.count({ where: { orgId, status: 'NEW', deletedAt: null } }),
        prisma.trialClassBooking.count({ where: { orgId, status: 'PENDING' } }),
        prisma.parentEnquiry.findMany({
          where: { orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            kidName: true,
            gradeSought: true,
            status: true,
            type: true,
            createdAt: true,
            parent: { select: { name: true } },
          },
        }),
      ])

    // Lazy grace sweep: the daily cron normally downgrades a lapsed grace
    // period, but a dashboard load can land first (or the env's DB may never
    // be cron-swept). Same page-load-reconcile pattern billing uses; the
    // conditional update inside downgradeOrgToFree makes cron races a no-op.
    let planMeta = orgMeta
    let moduleRows = orgModuleRows
    const graceEndsAt = orgMeta?.subscriptions?.[0]?.graceEndsAt ?? null
    if (orgMeta?.status === 'GRACE_PERIOD' && graceEndsAt && graceEndsAt < now) {
      try {
        const { downgradeOrgToFree } = await import('@/lib/billing/lifecycle')
        await downgradeOrgToFree(orgId, 'grace ended — swept on dashboard load')
        ;[planMeta, moduleRows] = await Promise.all([
          db.organization.findUnique({
            where: { id: orgId },
            select: {
              status: true,
              trialEndsAt: true,
              plan: {
                select: {
                  slug: true, name: true, monthlyPrice: true,
                  planModules: { select: { moduleSlug: true } }
                }
              },
              subscriptions: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { status: true, graceEndsAt: true }
              }
            }
          }),
          db.organizationModule.findMany({
            where: { orgId, enabled: true },
            select: { module: { select: { slug: true } } }
          })
        ])
      } catch (e) {
        console.error('lazy grace downgrade failed:', e)
      }
    }

    const result = {
      marketplace: {
        reviews: {
          latest: latestReviews,
          newThisWeek: reviewsThisWeek,
        },
        enquiries: {
          unactioned: newEnquiries,
          pendingTrials,
          recent: recentEnquiries,
        },
      },
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
        createdThisWeek: leadsCreatedThisWeek,
        createdToday: leadsCreatedToday,
        bySource: leadsBySource.map(l => ({
          source: l.source,
          count: l._count.source
        })),
        unassigned: unassignedLeadCount,
        followUpsDueToday: followUpsDueTodayCount
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
        collectedToday: collectedTodayAgg._sum.amount ?? 0,
        overdue:
          Number(feeOverdue._sum.totalAmount ?? 0) - Number(feeOverdue._sum.paidAmount ?? 0),
        upcoming:
          Number(feeUpcoming._sum.totalAmount ?? 0) - Number(feeUpcoming._sum.paidAmount ?? 0)
      },
      feeOverview: (() => {
        const overdueSet = new Set(overdueStudentRows.map(r => r.studentId))
        const dueSoonSet = new Set(dueSoonStudentRows.map(r => r.studentId))
        // Paid on time = has a paid invoice and nothing overdue right now
        const paidOnTime = paidStudentRows.filter(r => !overdueSet.has(r.studentId)).length
        const overdueOutstanding =
          Number(overdueOutstandingAgg._sum.totalAmount ?? 0) -
          Number(overdueOutstandingAgg._sum.paidAmount ?? 0)
        return {
          students: {
            total: enrolledStudents,
            paidOnTime,
            overdue: overdueSet.size,
            upcomingDues: dueSoonSet.size
          },
          overdueOutstanding,
          overdueOldestDays: oldestOverdueInvoice?.dueDate
            ? Math.max(0, Math.round((now.getTime() - new Date(oldestOverdueInvoice.dueDate).getTime()) / 86400000))
            : null,
          upcomingInvoiceCount,
          ytdCollected: Number(totalCollectedAgg._sum.amount ?? 0),
          lastPayment: lastPaymentRow
            ? {
                studentName:
                  lastPaymentRow.student?.name ??
                  lastPaymentRow.invoice?.student?.name ??
                  '—',
                amount: Number(lastPaymentRow.amount),
                date: lastPaymentRow.paidAt
              }
            : null
        }
      })(),
      profile: {
        views: school?.viewCount ?? 0,
        viewsThisWeek
      },
      meta: (() => {
        const enabled = new Set<string>()
        planMeta?.plan?.planModules?.forEach(pm => enabled.add(pm.moduleSlug))
        moduleRows.forEach(r => { if (r.module?.slug) enabled.add(r.module.slug) })
        const planSlug = planMeta?.plan?.slug ?? 'free'
        const status = (planMeta?.status as string) ?? 'TRIAL'
        const isPaid =
          status === 'ACTIVE' &&
          planSlug !== 'free' &&
          Number(planMeta?.plan?.monthlyPrice ?? 0) > 0
        const trialEndsAt = planMeta?.trialEndsAt ?? null
        const trialDaysLeft = trialEndsAt
          ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000))
          : null
        // Cron flips TRIAL → GRACE_PERIOD after expiry, but until it runs
        // (or in envs where it never does) the org can sit in TRIAL past its
        // end date — the banner must say "ended", not "ends today".
        const trialExpired = trialEndsAt ? new Date(trialEndsAt).getTime() < now.getTime() : false
        const inGrace = status === 'GRACE_PERIOD'
        const metaGraceEndsAt = inGrace ? planMeta?.subscriptions?.[0]?.graceEndsAt ?? null : null
        const graceDaysLeft = metaGraceEndsAt
          ? Math.max(0, Math.ceil((new Date(metaGraceEndsAt).getTime() - now.getTime()) / 86400000))
          : null
        return {
          institutionType: school?.institutionType ?? 'SCHOOL',
          orgStatus: status,
          planSlug,
          planName: planMeta?.plan?.name ?? 'Free',
          isPaid,
          isTrial: status === 'TRIAL',
          trialEndsAt,
          trialDaysLeft,
          trialExpired,
          inGrace,
          graceEndsAt: metaGraceEndsAt,
          graceDaysLeft,
          enabledModules: Array.from(enabled)
        }
      })(),
      upcomingEvents,
      eventsThisMonth: eventsThisMonthCount,
      recentActivity: recentActivities,
      upcomingFollowUps,
      attention: buildExecutiveAttention({
        uncontacted48h,
        invoicesOverdue60d: overdue60Agg._count._all,
        overdue60dAmount:
          Number(overdue60Agg._sum.totalAmount ?? 0) -
          Number(overdue60Agg._sum.paidAmount ?? 0),
        // Capacity chips stay executive-only — operational strip keeps to
        // act-now items
        gradesNearCapacity: [],
        stuckAdmissions
      })
    }

    // 5 min cache: the summary is 13 aggregate queries; a short TTL meant the
    // KPI row re-ran them (and rendered last) on almost every visit.
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
    return ok(result)
  }
})
