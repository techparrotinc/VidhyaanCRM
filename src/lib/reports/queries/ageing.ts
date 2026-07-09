import type { OrgScopedClient } from '@/lib/db/tenant'

// Ageing of open invoices. Balance (total − paid) is a computed column that
// can't be a SQL filter, so we page through matching invoices in chunks and
// aggregate in memory — no fixed row cap (the old 5,000-row fetch silently
// undercounted large orgs). Paged reads keep memory flat.

export const AGEING_BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const
export type AgeingBucket = (typeof AGEING_BUCKETS)[number]

export function bucketFor(daysOverdue: number): AgeingBucket {
  if (daysOverdue <= 30) return '0-30'
  if (daysOverdue <= 60) return '31-60'
  if (daysOverdue <= 90) return '61-90'
  return '90+'
}

export type AgeingResult = {
  buckets: { bucket: AgeingBucket; count: number; amount: number }[]
  outstanding: number
  overdue: number
  ninetyPlus: number
  defaulterCount: number
}

const PAGE = 2000

export async function computeAgeing(
  db: OrgScopedClient,
  where: object,
  startOfToday: Date
): Promise<AgeingResult> {
  const buckets = AGEING_BUCKETS.map(bucket => ({ bucket, count: 0, amount: 0 }))
  let outstanding = 0
  let overdue = 0
  const defaulters = new Set<string>()

  let skip = 0
  for (;;) {
    const page = await db.invoice.findMany({
      where,
      select: { dueDate: true, totalAmount: true, paidAmount: true, studentId: true },
      orderBy: { id: 'asc' },
      skip,
      take: PAGE
    })
    for (const inv of page) {
      const due = Number(inv.totalAmount) - Number(inv.paidAmount)
      if (due <= 0) continue
      outstanding += due
      if (!inv.dueDate || inv.dueDate >= startOfToday) continue
      overdue += due
      defaulters.add(inv.studentId)
      const days = Math.floor((startOfToday.getTime() - inv.dueDate.getTime()) / 864e5)
      const slot = buckets.find(b => b.bucket === bucketFor(days))!
      slot.count++
      slot.amount += due
    }
    if (page.length < PAGE) break
    skip += PAGE
  }

  return {
    buckets,
    outstanding,
    overdue,
    ninetyPlus: buckets.find(b => b.bucket === '90+')!.amount,
    defaulterCount: defaulters.size
  }
}
