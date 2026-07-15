import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUptimeRobotKey } from '@/lib/platform-config'
import { resolveAdminUser } from '@/lib/admin-auth'

// Average uptime % from UptimeRobot (last 7 days) when a key is configured.
// Fail-safe: returns null on any error/timeout so the dashboard degrades.
async function fetchUptimePct(): Promise<number | null> {
  try {
    const key = await getUptimeRobotKey()
    if (!key) return null
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: `api_key=${encodeURIComponent(key)}&format=json&custom_uptime_ratios=7`,
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null
    const data = await res.json()
    const monitors: any[] = data?.monitors || []
    if (monitors.length === 0) return null
    const ratios = monitors.map((m) => parseFloat(m.custom_uptime_ratio)).filter((n) => Number.isFinite(n))
    if (ratios.length === 0) return null
    return Math.round((ratios.reduce((s, r) => s + r, 0) / ratios.length) * 100) / 100
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await resolveAdminUser(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Measure data-layer round-trip for the platform-health panel.
    const dbT0 = Date.now()

    // Run parallel queries
    const [
      totalOrgs,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      freePlanOrgs,
      paidOrgs,
      newOrgsThisMonth,
      newOrgsLastMonth,
      
      activeSubscriptions,
      successfulTransactionsThisMonth,
      successfulTransactionsLastMonth,

      totalSchools,
      verifiedSchools,
      pendingSchools,
      totalLCs,
      totalParents,
      totalEnquiries,
      totalTrialBookings,
      totalSchoolViews,

      totalLeads,
      totalAdmissions,
      totalStudents,
      totalInvoicesSum,
      totalPaymentsSum,

      last10Orgs,
      last10Parents,
      last10Verifications,

      revenueTrendRaw,
      failedPaymentsThisWeek
    ] = await Promise.all([
      // Organization stats
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.organization.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.organization.count({
        where: {
          status: 'ACTIVE',
          trialEndsAt: { gt: now },
          deletedAt: null
        }
      }),
      prisma.organization.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
      prisma.organization.count({ where: { plan: { slug: 'free' }, deletedAt: null } }),
      prisma.organization.count({
        where: {
          subscriptions: { some: { status: 'ACTIVE' } },
          deletedAt: null
        }
      }),
      prisma.organization.count({
        where: { createdAt: { gte: startOfThisMonth }, deletedAt: null }
      }),
      prisma.organization.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          deletedAt: null
        }
      }),

      // Revenue queries
      prisma.subscription.findMany({
        where: { status: 'ACTIVE', deletedAt: null }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS', paidAt: { gte: startOfThisMonth } }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
      }),

      // Marketplace queries
      prisma.school.count({ where: { deletedAt: null } }),
      prisma.school.count({ where: { isVerified: true, deletedAt: null } }),
      prisma.school.count({ where: { verificationStatus: 'PENDING', deletedAt: null } }),
      prisma.school.count({ where: { institutionType: 'LEARNING_CENTER', deletedAt: null } }),
      prisma.parent.count({ where: { deletedAt: null } }),
      prisma.parentEnquiry.count({ where: { deletedAt: null } }),
      prisma.trialClassBooking.count(),
      prisma.schoolView.count(),

      // CRM queries
      prisma.lead.count({ where: { deletedAt: null } }),
      prisma.admission.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null }
      }),

      // Recent Activity
      prisma.organization.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { plan: { select: { name: true, slug: true } } },
        where: { deletedAt: null }
      }),
      prisma.parent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { deletedAt: null }
      }),
      prisma.school.findMany({
        take: 10,
        where: { verificationStatus: 'VERIFIED', deletedAt: null },
        orderBy: { verifiedAt: 'desc' }
      }),

      // Real monthly revenue for the last 12 months (successful transactions)
      prisma.$queryRaw<Array<{ m: Date; s: number }>>`
        SELECT date_trunc('month', "paid_at") AS m, sum("amount")::float AS s
        FROM "billing"."transactions"
        WHERE "status" = 'SUCCESS' AND "paid_at" >= ${twelveMonthsAgo}
        GROUP BY 1 ORDER BY 1`,
      // Failed payments in the last 7 days
      prisma.transaction.count({ where: { status: 'FAILED', createdAt: { gte: sevenDaysAgo } } })
    ])

    const dbLatencyMs = Date.now() - dbT0
    const uptimePct = await fetchUptimePct()

    // Build a dense 6-month trend (zero-fill missing months)
    const trendMap = new Map(revenueTrendRaw.map((r) => [r.m.toISOString().slice(0, 7), Number(r.s)]))
    const revenueTrend = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        month: key,
        value: trendMap.get(key) || 0,
      }
    })

    // Calculate growth percentages
    const orgGrowth = newOrgsLastMonth > 0 
      ? ((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100 
      : (newOrgsThisMonth > 0 ? 100 : 0)

    // Calculate MRR
    let mrr = 0
    activeSubscriptions.forEach((sub) => {
      const amount = Number(sub.amount)
      if (sub.billingCycle === 'MONTHLY') {
        mrr += amount
      } else if (sub.billingCycle === 'QUARTERLY') {
        mrr += amount / 3
      } else if (sub.billingCycle === 'ANNUAL') {
        mrr += amount / 12
      }
    })
    const arr = mrr * 12

    const revThisMonth = Number(successfulTransactionsThisMonth._sum.amount || 0)
    const revLastMonth = Number(successfulTransactionsLastMonth._sum.amount || 0)
    const revGrowth = revLastMonth > 0 
      ? ((revThisMonth - revLastMonth) / revLastMonth) * 100 
      : (revThisMonth > 0 ? 100 : 0)

    return NextResponse.json({
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        trial: trialOrgs,
        suspended: suspendedOrgs,
        freePlan: freePlanOrgs,
        paid: paidOrgs,
        newThisMonth: newOrgsThisMonth,
        newLastMonth: newOrgsLastMonth,
        growthPct: Number(orgGrowth.toFixed(2))
      },
      revenue: {
        activeSubscriptionAmount: activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0),
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        thisMonth: revThisMonth,
        lastMonth: revLastMonth,
        growthPct: Number(revGrowth.toFixed(2)),
        trend: revenueTrend
      },
      ops: {
        failedPaymentsThisWeek,
        dbLatencyMs,
        activeOrgs,
        uptimePct
      },
      marketplace: {
        totalSchools,
        verifiedSchools,
        pendingVerification: pendingSchools,
        totalLearningCenters: totalLCs,
        totalParents,
        totalEnquiries,
        totalTrialBookings,
        schoolViews: totalSchoolViews
      },
      crm: {
        totalLeads,
        totalAdmissions,
        totalStudents,
        totalInvoicesAmount: Number(totalInvoicesSum._sum.totalAmount || 0),
        totalPaymentsAmount: Number(totalPaymentsSum._sum.amount || 0)
      },
      recentActivity: {
        organizations: last10Orgs,
        parents: last10Parents,
        verifications: last10Verifications
      }
    })

  } catch (error: any) {
    console.error('Platform Stats API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
