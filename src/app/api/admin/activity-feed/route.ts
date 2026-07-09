import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Live platform activity feed for the admin notification bell. Derived from
// existing data (no stored feed): new signups, pending verifications, failed
// payments, and trials expiring soon.
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [newOrgs, pendingSchools, failedTx, expiringTrials] = await Promise.all([
      prisma.organization.findMany({
        where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        select: { id: true, name: true, createdAt: true, institutionType: true },
        orderBy: { createdAt: 'desc' }, take: 6,
      }),
      prisma.school.findMany({
        where: { deletedAt: null, verificationStatus: 'PENDING' },
        select: { id: true, name: true, createdAt: true, organization: { select: { id: true } } },
        orderBy: { createdAt: 'desc' }, take: 6,
      }),
      prisma.transaction.findMany({
        where: { status: 'FAILED', createdAt: { gte: sevenDaysAgo } },
        select: { id: true, amount: true, createdAt: true, orgId: true, organization: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }, take: 6,
      }),
      prisma.organization.findMany({
        where: { deletedAt: null, status: 'TRIAL', trialEndsAt: { gte: now, lte: inSevenDays } },
        select: { id: true, name: true, trialEndsAt: true },
        orderBy: { trialEndsAt: 'asc' }, take: 6,
      }),
    ])

    type Item = { id: string; type: string; title: string; subtitle: string; at: string; link: string }
    const items: Item[] = []

    for (const o of newOrgs) {
      items.push({
        id: `org-${o.id}`, type: 'signup', title: 'New organization',
        subtitle: `${o.name} (${o.institutionType.toLowerCase().replace('_', ' ')})`,
        at: o.createdAt.toISOString(), link: `/admin/orgs/${o.id}`,
      })
    }
    for (const s of pendingSchools) {
      items.push({
        id: `sch-${s.id}`, type: 'verification', title: 'Listing awaiting verification',
        subtitle: s.name, at: s.createdAt.toISOString(),
        link: s.organization ? `/admin/orgs/${s.organization.id}` : '/admin/schools',
      })
    }
    for (const t of failedTx) {
      items.push({
        id: `tx-${t.id}`, type: 'failed_payment', title: 'Payment failed',
        subtitle: `${t.organization?.name || 'Org'} — ₹${Number(t.amount).toLocaleString('en-IN')}`,
        at: t.createdAt.toISOString(), link: '/admin/revenue',
      })
    }
    for (const o of expiringTrials) {
      const days = Math.max(0, Math.ceil(((o.trialEndsAt as Date).getTime() - now.getTime()) / 86400000))
      items.push({
        id: `trial-${o.id}`, type: 'trial', title: `Trial ending in ${days}d`,
        subtitle: o.name, at: (o.trialEndsAt as Date).toISOString(), link: `/admin/orgs/${o.id}`,
      })
    }

    items.sort((a, b) => (a.at < b.at ? 1 : -1))

    return NextResponse.json({ items: items.slice(0, 15), count: items.length })
  } catch (error: any) {
    console.error('Admin activity feed error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
