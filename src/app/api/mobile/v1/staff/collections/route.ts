import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireStaffClaims } from '@/lib/mobile-auth/guard'
import { ROLES } from '@/constants/roles'

/**
 * Collections summary for the mobile staff app (wireframe s-collections):
 * month / quarter / financial-year totals, each with the matching previous
 * period for comparison. Live sums over crm.payments (SUCCESS only) — org
 * volumes make these cheap, no rollup dependency. FY = Apr–Mar.
 */

const MONEY_ROLES: string[] = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.ACCOUNTANT]

async function collected(orgId: string, gte: Date, lt: Date): Promise<number> {
  const r = await prisma.payment.aggregate({
    where: { orgId, status: 'SUCCESS', deletedAt: null, paidAt: { gte, lt } },
    _sum: { amount: true }
  })
  return Number(r._sum.amount ?? 0)
}

export async function GET(req: NextRequest) {
  const auth = await requireStaffClaims(req)
  if ('error' in auth) return auth.error
  const { orgId, role } = auth.claims
  if (!MONEY_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 })
  }

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-based

  // Month: this month vs same month last year
  const monthStart = new Date(y, m, 1)
  const nextMonth = new Date(y, m + 1, 1)
  const lyMonthStart = new Date(y - 1, m, 1)
  const lyNextMonth = new Date(y - 1, m + 1, 1)

  // FY (Apr–Mar): current FY start
  const fyStartYear = m >= 3 ? y : y - 1
  const fyStart = new Date(fyStartYear, 3, 1)
  const prevFyStart = new Date(fyStartYear - 1, 3, 1)

  // Quarter within FY: Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar
  const qIndex = Math.floor(((m - 3 + 12) % 12) / 3) // 0..3 within FY
  const qStart = new Date(fyStartYear, 3 + qIndex * 3, 1)
  const qEnd = new Date(fyStartYear, 3 + qIndex * 3 + 3, 1)
  const prevQStart = new Date(fyStartYear - 1, 3 + qIndex * 3, 1)
  const prevQEnd = new Date(fyStartYear - 1, 3 + qIndex * 3 + 3, 1)

  const [monthNow, monthLy, quarterNow, quarterPrev, fyToDate, fyPrevFull] = await Promise.all([
    collected(orgId, monthStart, nextMonth),
    collected(orgId, lyMonthStart, lyNextMonth),
    collected(orgId, qStart, qEnd),
    collected(orgId, prevQStart, prevQEnd),
    collected(orgId, fyStart, new Date(fyStartYear + 1, 3, 1)),
    collected(orgId, prevFyStart, fyStart)
  ])

  const monthName = monthStart.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const lyMonthName = lyMonthStart.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
  const fyLabel = (start: number) => `FY ${String(start).slice(2)}–${String(start + 1).slice(2)}`

  return NextResponse.json({
    success: true,
    month: {
      label: monthName,
      amount: monthNow,
      prevLabel: lyMonthName,
      prevAmount: monthLy,
      deltaPct: monthLy > 0 ? Math.round(((monthNow - monthLy) / monthLy) * 100) : null
    },
    quarter: {
      label: `Q${qIndex + 1} ${fyLabel(fyStartYear)}`,
      amount: quarterNow,
      prevLabel: `Q${qIndex + 1} ${fyLabel(fyStartYear - 1)}`,
      prevAmount: quarterPrev,
      deltaPct: quarterPrev > 0 ? Math.round(((quarterNow - quarterPrev) / quarterPrev) * 100) : null
    },
    year: {
      label: `${fyLabel(fyStartYear)} · to date`,
      amount: fyToDate,
      prevLabel: `${fyLabel(fyStartYear - 1)} · full year`,
      prevAmount: fyPrevFull,
      deltaPct: fyPrevFull > 0 ? Math.round(((fyToDate - fyPrevFull) / fyPrevFull) * 100) : null
    }
  })
}
