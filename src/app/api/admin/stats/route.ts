import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

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
      last10Verifications
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
      })
    ])

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
        growthPct: Number(revGrowth.toFixed(2))
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
