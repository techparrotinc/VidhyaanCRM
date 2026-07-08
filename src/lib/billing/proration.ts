import { prisma } from '@/lib/db'
import { prorationCreditAmount } from '@/lib/billing/money'

export interface ProrationCredit {
  credit: number // ₹ value of the unused portion of the current subscription
  remainingDays: number
  totalDays: number
  currentPlanName: string
  currentPeriodEnd: Date
}

/**
 * Unused-period credit for the org's active paid subscription.
 * credit = subscription amount × remaining days ÷ total period days.
 * Null when there is nothing to prorate (no active paid sub, or period over).
 */
export async function computeProrationCredit(orgId: string): Promise<ProrationCredit | null> {
  const sub = await prisma.subscription.findFirst({
    where: { orgId, status: 'ACTIVE', deletedAt: null },
    include: { plan: { select: { name: true, slug: true } } }
  })
  if (!sub || !sub.startedAt || !sub.currentPeriodEnd) return null

  const amount = Number(sub.amount)
  if (amount <= 0) return null

  const { credit, remainingDays, totalDays } = prorationCreditAmount(
    amount,
    sub.startedAt.getTime(),
    sub.currentPeriodEnd.getTime(),
    Date.now()
  )
  if (credit <= 0) return null

  return {
    credit,
    remainingDays,
    totalDays,
    currentPlanName: sub.plan.name,
    currentPeriodEnd: sub.currentPeriodEnd
  }
}
