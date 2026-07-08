import { Prisma, PrismaClient } from '@prisma/client'

// Nightly aggregation into reporting.daily_rollups. Runs on the BASE prisma
// client with explicit orgId scoping (cron has no tenant session — same
// pattern as the webhook route). Idempotency: delete-then-insert per
// org×date, so re-running any day is safe and edits/late payments within the
// cron's trailing window self-heal.
//
// Day boundaries are IST (schools operate in IST; "yesterday" must mean the
// school's yesterday, not UTC's).

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export type RollupRow = {
  branchId: string | null
  academicYearId: string | null
  metric: string
  dimension: string | null
  dimensionValue: string | null
  count: number
  amount: Prisma.Decimal | null
}

/** [start, end) UTC instants covering IST calendar day `date` (YYYY-MM-DD). */
export function istDayWindow(date: string): { start: Date; end: Date } {
  const utcMidnight = new Date(`${date}T00:00:00.000Z`)
  if (isNaN(utcMidnight.getTime())) {
    throw new Error(`Invalid rollup date "${date}" (expected YYYY-MM-DD)`)
  }
  const start = new Date(utcMidnight.getTime() - IST_OFFSET_MS)
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}

/** Today/yesterday as IST calendar dates (YYYY-MM-DD). */
export function istDateString(d: Date = new Date()): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

export async function computeDailyRollups(
  prisma: PrismaClient,
  orgId: string,
  date: string
): Promise<RollupRow[]> {
  const { start, end } = istDayWindow(date)
  const window = { gte: start, lt: end }
  const rows: RollupRow[] = []

  const push = (
    metric: string,
    groups: Array<{
      branchId?: string | null
      academicYearId?: string | null
      dimension?: string | null
      dimensionValue?: string | null
      count: number
      amount?: Prisma.Decimal | null
    }>
  ) => {
    for (const g of groups) {
      if (g.count === 0 && (g.amount == null || Number(g.amount) === 0)) continue
      rows.push({
        branchId: g.branchId ?? null,
        academicYearId: g.academicYearId ?? null,
        metric,
        dimension: g.dimension ?? null,
        dimensionValue: g.dimensionValue ?? null,
        count: g.count,
        amount: g.amount ?? null
      })
    }
  }

  const [
    leadsCreated,
    leadsContacted,
    admissionsStarted,
    admissionsAdmitted,
    invoiced,
    collected,
    concessions,
    creditsSpent
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ['branchId', 'academicYearId', 'source'],
      where: { orgId, deletedAt: null, createdAt: window },
      _count: { _all: true }
    }),
    prisma.lead.groupBy({
      by: ['branchId', 'academicYearId'],
      where: { orgId, deletedAt: null, firstContactedAt: window },
      _count: { _all: true }
    }),
    prisma.admission.groupBy({
      by: ['branchId', 'academicYearId'],
      where: { orgId, deletedAt: null, createdAt: window },
      _count: { _all: true }
    }),
    prisma.admission.groupBy({
      by: ['branchId', 'academicYearId'],
      where: { orgId, deletedAt: null, status: 'ADMITTED', decidedAt: window },
      _count: { _all: true }
    }),
    prisma.invoice.groupBy({
      by: ['branchId', 'academicYearId'],
      where: { orgId, deletedAt: null, createdAt: window },
      _count: { _all: true },
      _sum: { totalAmount: true }
    }),
    prisma.payment.groupBy({
      by: ['branchId', 'academicYearId', 'method'],
      where: { orgId, deletedAt: null, status: 'SUCCESS', paidAt: window },
      _count: { _all: true },
      _sum: { amount: true }
    }),
    prisma.concession.groupBy({
      by: ['type'],
      where: { orgId, deletedAt: null, createdAt: window },
      _count: { _all: true },
      _sum: { value: true }
    }),
    prisma.messageCreditLedger.groupBy({
      by: ['channel'],
      where: { orgId, delta: { lt: 0 }, createdAt: window },
      _count: { _all: true },
      _sum: { delta: true }
    })
  ])

  push('leads_created', leadsCreated.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId,
    dimension: 'source', dimensionValue: g.source, count: g._count._all
  })))
  push('leads_contacted', leadsContacted.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId, count: g._count._all
  })))
  push('admissions_started', admissionsStarted.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId, count: g._count._all
  })))
  push('admissions_admitted', admissionsAdmitted.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId, count: g._count._all
  })))
  push('invoiced_amount', invoiced.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId,
    count: g._count._all, amount: g._sum.totalAmount
  })))
  push('collected_amount', collected.map(g => ({
    branchId: g.branchId, academicYearId: g.academicYearId,
    dimension: 'method', dimensionValue: g.method,
    count: g._count._all, amount: g._sum.amount
  })))
  // Concessions and credit spend carry no branch/AY columns — org-level grain.
  push('concession_amount', concessions.map(g => ({
    dimension: 'type', dimensionValue: g.type,
    count: g._count._all, amount: g._sum.value
  })))
  push('campaign_credits_spent', creditsSpent.map(g => ({
    dimension: 'channel', dimensionValue: g.channel,
    count: g._count._all,
    amount: g._sum.delta == null ? null : new Prisma.Decimal(-g._sum.delta)
  })))

  // students_active is a point-in-time snapshot, not an event count — it can
  // only be observed "now", so it is written solely when rolling up the most
  // recent completed IST day. Historical re-runs must not overwrite it with
  // today's count, hence the guard (and the metric filter in writeDailyRollups).
  if (date === istDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))) {
    const active = await prisma.student.groupBy({
      by: ['branchId', 'academicYearId'],
      where: { orgId, deletedAt: null, status: 'ACTIVE' },
      _count: { _all: true }
    })
    push('students_active', active.map(g => ({
      branchId: g.branchId, academicYearId: g.academicYearId, count: g._count._all
    })))
  }

  return rows
}

/** Delete-then-insert the org×date slice. Snapshot metrics survive re-runs
 *  that didn't recompute them. */
export async function writeDailyRollups(
  prisma: PrismaClient,
  orgId: string,
  date: string,
  rows: RollupRow[]
): Promise<number> {
  const day = new Date(`${date}T00:00:00.000Z`)
  const recomputedMetrics = [...new Set(rows.map(r => r.metric))]
  const eventMetrics = [
    'leads_created', 'leads_contacted', 'admissions_started',
    'admissions_admitted', 'invoiced_amount', 'collected_amount',
    'concession_amount', 'campaign_credits_spent'
  ]
  const metricsToClear = [...new Set([...eventMetrics, ...recomputedMetrics])]

  await prisma.$transaction([
    prisma.dailyRollup.deleteMany({
      where: { orgId, date: day, metric: { in: metricsToClear } }
    }),
    prisma.dailyRollup.createMany({
      data: rows.map(r => ({ ...r, orgId, date: day }))
    })
  ])
  return rows.length
}

export async function rollupOrgDay(
  prisma: PrismaClient,
  orgId: string,
  date: string
): Promise<number> {
  const rows = await computeDailyRollups(prisma, orgId, date)
  return writeDailyRollups(prisma, orgId, date, rows)
}
