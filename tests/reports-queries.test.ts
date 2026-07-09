import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { forOrg } from '@/lib/db/tenant'
import { REPORT_QUERIES } from '@/lib/reports/queries'
import { REPORTS } from '@/lib/reports/registry'
import type { ReportCtx } from '@/lib/reports/queries/types'

// Integration tests for the report query modules against DATABASE_URL.
// Two throwaway orgs verify results and org/role scoping end to end.

const RUN = `rptq-test-${Date.now()}`

let orgA: string
let orgB: string
let counsellorId: string

function ctxFor(orgId: string, overrides: Partial<ReportCtx> = {}): ReportCtx {
  return {
    db: forOrg(orgId),
    orgId,
    userId: 'nobody',
    role: 'ORG_ADMIN',
    branchIds: null,
    academicYearId: undefined,
    ...overrides
  }
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.organization.create({
      data: {
        name: `${RUN}-a`, slug: `${RUN}-a`, institutionType: 'SCHOOL',
        email: 'a@rptq.local', phone: '0', isDummy: true
      }
    }),
    prisma.organization.create({
      data: {
        name: `${RUN}-b`, slug: `${RUN}-b`, institutionType: 'SCHOOL',
        email: 'b@rptq.local', phone: '0', isDummy: true
      }
    })
  ])
  orgA = a.id
  orgB = b.id

  const user = await prisma.user.create({
    data: {
      orgId: orgA, name: 'Counsellor One', email: `${RUN}@rptq.local`,
      phone: `9${Date.now() % 1e9}`, status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'COUNSELLOR', orgId: orgA, status: 'ACTIVE' }
      }
    }
  })
  counsellorId = user.id

  await prisma.lead.createMany({
    data: [
      // 12 WALK_IN leads, 3 converted, all contacted — beats low-sample cutoff
      ...Array.from({ length: 12 }, (_, i) => ({
        orgId: orgA, leadCode: `${RUN}-W${i}`, parentName: `W${i}`,
        phone: `1${String(i).padStart(9, '0')}`, source: 'WALK_IN' as const,
        status: (i < 3 ? 'CONVERTED' : 'CONTACTED') as never,
        firstContactedAt: new Date(),
        assignedToId: i < 6 ? counsellorId : null
      })),
      // 10 GOOGLE_ADS leads, 0 converted, uncontacted
      ...Array.from({ length: 10 }, (_, i) => ({
        orgId: orgA, leadCode: `${RUN}-G${i}`, parentName: `G${i}`,
        phone: `2${String(i).padStart(9, '0')}`, source: 'GOOGLE_ADS' as const,
        status: 'NEW' as never,
        nextFollowUpAt: new Date(Date.now() - 3 * 864e5) // overdue follow-ups
      })),
      // Cross-org noise
      { orgId: orgB, leadCode: `${RUN}-X`, parentName: 'X', phone: '3000000000', source: 'WALK_IN' as const, status: 'CONVERTED' as never }
    ]
  })

  const student = await prisma.student.create({
    data: { orgId: orgA, studentCode: `${RUN}-S`, name: 'Kid', status: 'ACTIVE', gradeLabel: 'Grade 1' }
  })
  await prisma.invoice.create({
    data: {
      orgId: orgA, invoiceNumber: `${RUN}-I`, studentId: student.id,
      totalAmount: 5000, paidAmount: 1000, status: 'PARTIALLY_PAID',
      dueDate: new Date(Date.now() - 45 * 864e5) // 31-60 bucket
    }
  })
})

afterAll(async () => {
  // Guard every id: if beforeAll died before assigning them, an undefined in
  // a where clause makes Prisma drop the filter entirely — deleteMany({})
  // would wipe the whole table (this happened; see work log 2026-07-08).
  const orgIds = [orgA, orgB].filter(Boolean)
  if (orgIds.length > 0) {
    const orgs = { orgId: { in: orgIds } }
    await prisma.invoice.deleteMany({ where: orgs })
    await prisma.student.deleteMany({ where: orgs })
    await prisma.lead.deleteMany({ where: orgs })
  }
  if (counsellorId) {
    await prisma.userRoleAssignment.deleteMany({ where: { userId: counsellorId } })
    await prisma.user.deleteMany({ where: { id: counsellorId } })
  }
  if (orgIds.length > 0) {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } })
  }
  await prisma.$disconnect()
})

describe('registry ↔ query dispatch parity', () => {
  it('every registered report has a query module and vice versa', () => {
    const registryKeys = REPORTS.map(r => r.key).sort()
    const queryKeys = Object.keys(REPORT_QUERIES).sort()
    expect(queryKeys).toEqual(registryKeys)
  })
})

describe('lead-funnel', () => {
  it('counts statuses and computes conversion for the org only', async () => {
    const s = await REPORT_QUERIES['lead-funnel'].summary(ctxFor(orgA), {})
    const total = s.kpis.find(k => k.key === 'total')!
    expect(total.value).toBe(22) // orgB lead excluded
    const converted = s.kpis.find(k => k.key === 'convertedPct')!
    expect(converted.value).toBeCloseTo(3 / 22, 5)
  })

  it('COUNSELLOR role sees own leads only', async () => {
    const s = await REPORT_QUERIES['lead-funnel'].summary(
      ctxFor(orgA, { role: 'COUNSELLOR', userId: counsellorId }),
      {}
    )
    expect(s.kpis.find(k => k.key === 'total')!.value).toBe(6)
  })

  it('source filter narrows the funnel', async () => {
    const s = await REPORT_QUERIES['lead-funnel'].summary(ctxFor(orgA), { source: 'GOOGLE_ADS' })
    expect(s.kpis.find(k => k.key === 'total')!.value).toBe(10)
  })
})

describe('lead-source-effectiveness', () => {
  it('ranks sources and flags conversion gaps', async () => {
    const r = await REPORT_QUERIES['lead-source-effectiveness'].rows(ctxFor(orgA), {}, undefined, 50)
    const walkIn = r.rows.find(x => x.source === 'WALK IN')!
    const ads = r.rows.find(x => x.source === 'GOOGLE ADS')!
    expect(walkIn.leads).toBe(12)
    expect(walkIn.conversionPct).toBeCloseTo(0.25, 5)
    expect(ads.converted).toBe(0)

    const s = await REPORT_QUERIES['lead-source-effectiveness'].summary(ctxFor(orgA), {})
    expect(s.kpis.find(k => k.key === 'best')!.value).toBe('WALK IN')
  })
})

describe('follow-up-discipline', () => {
  it('surfaces overdue follow-ups with day counts', async () => {
    const s = await REPORT_QUERIES['follow-up-discipline'].summary(ctxFor(orgA), {})
    expect(s.kpis.find(k => k.key === 'overdue')!.value).toBe(10)

    const r = await REPORT_QUERIES['follow-up-discipline'].rows(
      ctxFor(orgA), { overdue: 'true' }, undefined, 50
    )
    expect(r.rows).toHaveLength(10)
    // 3 days back from "now" is 2–3 whole days before today's midnight
    expect(Number(r.rows[0].daysOverdue)).toBeGreaterThanOrEqual(2)
    expect(r.rows[0].counsellor).toBe('Unassigned')
  })
})

describe('defaulter-ageing', () => {
  it('buckets balances and lists defaulters', async () => {
    const s = await REPORT_QUERIES['defaulter-ageing'].summary(ctxFor(orgA), {})
    expect(s.kpis.find(k => k.key === 'outstanding')!.value).toBe(4000)
    const ageing = (s.charts.ageing as { bucket: string; amount: number }[])
    expect(ageing.find(b => b.bucket === '31-60')!.amount).toBe(4000)

    const r = await REPORT_QUERIES['defaulter-ageing'].rows(ctxFor(orgA), {}, undefined, 50)
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].amountDue).toBe(4000)
    expect(r.rows[0].daysOverdue).toBeGreaterThanOrEqual(44)
  })

  it('minAmount filter excludes small balances', async () => {
    const r = await REPORT_QUERIES['defaulter-ageing'].rows(
      ctxFor(orgA), { minAmount: '5000' }, undefined, 50
    )
    expect(r.rows).toHaveLength(0)
  })

  it('paginates without skipping any defaulter (regression)', async () => {
    // 5 overdue invoices in orgB; drain with a tiny page size and assert
    // every invoice appears exactly once — guards the cursor-advance bug
    // where over-fetch + slice silently dropped rows between pages.
    const student = await prisma.student.create({
      data: { orgId: orgB, studentCode: `${RUN}-PS`, name: 'Payer', status: 'ACTIVE', gradeLabel: 'Grade 2' }
    })
    const dueDate = new Date(Date.now() - 40 * 864e5)
    await prisma.invoice.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        orgId: orgB, invoiceNumber: `${RUN}-PG${i}`, studentId: student.id,
        totalAmount: 1000, paidAmount: 100, status: 'PARTIALLY_PAID' as never, dueDate
      }))
    })

    const seen = new Set<string>()
    let cursor: string | undefined
    let guard = 0
    do {
      const page = await REPORT_QUERIES['defaulter-ageing'].rows(ctxFor(orgB), {}, cursor, 2)
      page.rows.forEach(r => seen.add(r.invoiceNumber as string))
      cursor = page.nextCursor ?? undefined
    } while (cursor && ++guard < 20)

    expect(seen.size).toBe(5)
    expect([...seen].sort()).toEqual(
      Array.from({ length: 5 }, (_, i) => `${RUN}-PG${i}`).sort()
    )
  })
})

describe('enrollment-strength', () => {
  it('tallies active students by grade', async () => {
    const r = await REPORT_QUERIES['enrollment-strength'].rows(ctxFor(orgA), {}, undefined, 50)
    const g1 = r.rows.find(x => x.grade === 'Grade 1')!
    expect(g1.students).toBe(1)
  })
})
