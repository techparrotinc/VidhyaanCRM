import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }

    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const startOfThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    // Execute queries in parallel using Promise.all
    const [
      totalOrgs,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      freeOrgs,
      paidOrgs,
      activeSubs,
      thisMonthTx,
      lastMonthTx,
      totalLeads,
      totalAdmissions,
      totalStudents,
      totalParents,
      totalSchools
    ] = await Promise.all([
      // Org counts
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.organization.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.organization.count({ where: { status: 'TRIAL', deletedAt: null } }),
      prisma.organization.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
      prisma.organization.count({
        where: {
          deletedAt: null,
          OR: [
            { planId: null },
            { plan: { slug: 'free' } }
          ]
        }
      }),
      prisma.organization.count({
        where: {
          deletedAt: null,
          AND: [
            { planId: { not: null } },
            { NOT: { plan: { slug: 'free' } } }
          ]
        }
      }),
      // Active subscriptions
      prisma.subscription.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { amount: true, billingCycle: true }
      }),
      // Revenue transactions
      prisma.transaction.findMany({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: startOfThisMonth,
            lt: startOfNextMonth
          }
        },
        select: { amount: true }
      }),
      prisma.transaction.findMany({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth
          }
        },
        select: { amount: true }
      }),
      // Platform wide counts
      prisma.lead.count({ where: { deletedAt: null } }),
      prisma.admission.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'PARENT', deletedAt: null } }),
      prisma.school.count({ where: { deletedAt: null } })
    ])

    // Calculate MRR & ARR
    let mrr = 0
    activeSubs.forEach((sub) => {
      const amt = Number(sub.amount)
      if (sub.billingCycle === 'MONTHLY') mrr += amt
      else if (sub.billingCycle === 'QUARTERLY') mrr += amt / 3
      else if (sub.billingCycle === 'ANNUAL') mrr += amt / 12
    })
    const arr = mrr * 12

    // Calculate actual transaction values
    const thisMonth = thisMonthTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const lastMonth = lastMonthTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

    return ok({
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        trial: trialOrgs,
        suspended: suspendedOrgs,
        free: freeOrgs,
        paid: paidOrgs
      },
      revenue: {
        mrr,
        arr,
        thisMonth,
        lastMonth,
        growth
      },
      platform: {
        totalLeads,
        totalAdmissions,
        totalStudents,
        totalParents,
        totalSchools
      }
    })

  } catch (error) {
    return errorResponse(error)
  }
}
