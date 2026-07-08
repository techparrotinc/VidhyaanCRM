import { Prisma, PrismaClient } from '@prisma/client'
import { istDateString } from './rollup'

// Set-based backfill for reporting.daily_rollups. The nightly cron
// (rollup.ts) recomputes 3 trailing days per org with Prisma groupBys —
// fine at that scale. Backfilling months × orgs that way is O(orgs × days)
// network round-trips; this module does it in ONE aggregate query per
// metric across all orgs and days (GROUP BY org, day), ~10 queries total.
//
// Metric definitions MUST stay in lockstep with computeDailyRollups —
// tests/reports-rollup-backfill.test.ts compares both paths on a fixture.

const IST = Prisma.sql`interval '5 hours 30 minutes'`

type RawRow = {
  org_id: string
  branch_id: string | null
  academic_year_id: string | null
  day: Date
  dimension_value: string | null
  count: number
  amount: string | null
}

const EVENT_METRICS = [
  'leads_created', 'leads_contacted', 'admissions_started',
  'admissions_admitted', 'invoiced_amount', 'collected_amount',
  'concession_amount', 'campaign_credits_spent'
]

export async function backfillRollupRange(
  prisma: PrismaClient,
  input: { from: string; to: string; orgId?: string }
): Promise<number> {
  const from = new Date(`${input.from}T00:00:00Z`)
  const to = new Date(`${input.to}T00:00:00Z`)
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    throw new Error(`Invalid backfill range ${input.from} → ${input.to}`)
  }
  // UTC instants covering the IST days [from, to]
  const startUtc = new Date(from.getTime() - 5.5 * 36e5)
  const endUtc = new Date(to.getTime() - 5.5 * 36e5 + 24 * 36e5)

  const orgSql = (col: Prisma.Sql) =>
    input.orgId ? Prisma.sql`AND ${col} = ${input.orgId}` : Prisma.empty

  const q = (sql: Prisma.Sql) => prisma.$queryRaw<RawRow[]>(sql)

  const [
    leadsCreated, leadsContacted, admissionsStarted, admissionsAdmitted,
    invoiced, collected, concessions, creditsSpent
  ] = await Promise.all([
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (created_at + ${IST})::date AS day,
             source::text AS dimension_value,
             count(*)::int AS count, NULL AS amount
      FROM crm.leads
      WHERE deleted_at IS NULL
        AND created_at >= ${startUtc} AND created_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4, 5`),
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (first_contacted_at + ${IST})::date AS day,
             NULL AS dimension_value,
             count(*)::int AS count, NULL AS amount
      FROM crm.leads
      WHERE deleted_at IS NULL
        AND first_contacted_at >= ${startUtc} AND first_contacted_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4`),
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (created_at + ${IST})::date AS day,
             NULL AS dimension_value,
             count(*)::int AS count, NULL AS amount
      FROM crm.admissions
      WHERE deleted_at IS NULL
        AND created_at >= ${startUtc} AND created_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4`),
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (decided_at + ${IST})::date AS day,
             NULL AS dimension_value,
             count(*)::int AS count, NULL AS amount
      FROM crm.admissions
      WHERE deleted_at IS NULL AND status = 'ADMITTED'
        AND decided_at >= ${startUtc} AND decided_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4`),
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (created_at + ${IST})::date AS day,
             NULL AS dimension_value,
             count(*)::int AS count,
             sum(total_amount)::numeric(12,2)::text AS amount
      FROM crm.invoices
      WHERE deleted_at IS NULL
        AND created_at >= ${startUtc} AND created_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4`),
    q(Prisma.sql`
      SELECT org_id, branch_id, academic_year_id,
             (paid_at + ${IST})::date AS day,
             method::text AS dimension_value,
             count(*)::int AS count,
             sum(amount)::numeric(12,2)::text AS amount
      FROM crm.payments
      WHERE deleted_at IS NULL AND status = 'SUCCESS'
        AND paid_at >= ${startUtc} AND paid_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 2, 3, 4, 5`),
    q(Prisma.sql`
      SELECT org_id, NULL AS branch_id, NULL AS academic_year_id,
             (created_at + ${IST})::date AS day,
             type::text AS dimension_value,
             count(*)::int AS count,
             sum(value)::numeric(12,2)::text AS amount
      FROM crm.concessions
      WHERE deleted_at IS NULL
        AND created_at >= ${startUtc} AND created_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 4, 5`),
    q(Prisma.sql`
      SELECT org_id, NULL AS branch_id, NULL AS academic_year_id,
             (created_at + ${IST})::date AS day,
             channel::text AS dimension_value,
             count(*)::int AS count,
             sum(-delta)::numeric(12,2)::text AS amount
      FROM billing.message_credit_ledger
      WHERE delta < 0
        AND created_at >= ${startUtc} AND created_at < ${endUtc}
        ${orgSql(Prisma.sql`org_id`)}
      GROUP BY 1, 4, 5`)
  ])

  const rows: Prisma.DailyRollupCreateManyInput[] = []
  const push = (metric: string, dimension: string | null, raw: RawRow[]) => {
    for (const r of raw) {
      if (r.count === 0 && (r.amount === null || Number(r.amount) === 0)) continue
      rows.push({
        orgId: r.org_id,
        branchId: r.branch_id,
        academicYearId: r.academic_year_id,
        date: r.day,
        metric,
        dimension: r.dimension_value !== null ? dimension : null,
        dimensionValue: r.dimension_value,
        count: r.count,
        amount: r.amount !== null ? new Prisma.Decimal(r.amount) : null
      })
    }
  }
  push('leads_created', 'source', leadsCreated)
  push('leads_contacted', null, leadsContacted)
  push('admissions_started', null, admissionsStarted)
  push('admissions_admitted', null, admissionsAdmitted)
  push('invoiced_amount', null, invoiced)
  push('collected_amount', 'method', collected)
  push('concession_amount', 'type', concessions)
  push('campaign_credits_spent', 'channel', creditsSpent)

  // students_active is a point-in-time snapshot — only writable as "now",
  // stamped on the latest completed IST day when the range includes it.
  const yesterday = istDateString(new Date(Date.now() - 24 * 36e5))
  const snapshotMetrics: string[] = []
  if (input.from <= yesterday && yesterday <= input.to) {
    const active = await prisma.student.groupBy({
      by: ['orgId', 'branchId', 'academicYearId'],
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...(input.orgId ? { orgId: input.orgId } : {})
      },
      _count: { _all: true }
    })
    for (const g of active) {
      rows.push({
        orgId: g.orgId,
        branchId: g.branchId,
        academicYearId: g.academicYearId,
        date: new Date(`${yesterday}T00:00:00Z`),
        metric: 'students_active',
        dimension: null,
        dimensionValue: null,
        count: g._count._all,
        amount: null
      })
    }
    snapshotMetrics.push('students_active')
  }

  // Idempotency: clear the range for recomputed metrics, then bulk insert.
  await prisma.dailyRollup.deleteMany({
    where: {
      date: { gte: from, lte: to },
      metric: { in: [...EVENT_METRICS, ...snapshotMetrics] },
      ...(input.orgId ? { orgId: input.orgId } : {})
    }
  })
  for (let i = 0; i < rows.length; i += 1000) {
    await prisma.dailyRollup.createMany({ data: rows.slice(i, i + 1000) })
  }
  return rows.length
}
