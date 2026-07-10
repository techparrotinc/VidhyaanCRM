import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { forOrg } from '@/lib/db/tenant'
import {
  istDayWindow,
  istDateString,
  computeDailyRollups,
  rollupOrgDay
} from '@/lib/reports/rollup'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL) // no test DB -> skip, never touch prod

// Integration tests against the DATABASE_URL database (same pattern as
// tenant-isolation): seeds two throwaway orgs (isDummy) with a known day of
// activity, asserts rollup correctness, idempotency, and org scoping, then
// hard-deletes everything it created.

const RUN = `rollup-test-${Date.now()}`

// Yesterday in IST — the only date students_active snapshots are written for.
const DATE = istDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))
// 10:00 IST on that day, safely inside the window.
const AT = new Date(istDayWindow(DATE).start.getTime() + 10 * 60 * 60 * 1000)

let orgA: string
let orgB: string

async function createOrg(suffix: string) {
  const org = await prisma.organization.create({
    data: {
      name: `${RUN}-${suffix}`,
      slug: `${RUN}-${suffix}`,
      institutionType: 'SCHOOL',
      email: `${suffix}@rollup-test.local`,
      phone: '0000000000',
      isDummy: true
    }
  })
  return org.id
}

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) return // DB suites skipped; don't touch prod
  orgA = await createOrg('a')
  orgB = await createOrg('b')

  await prisma.lead.createMany({
    data: [
      { orgId: orgA, leadCode: `${RUN}-L1`, parentName: 'P1', phone: '1111111111', source: 'WALK_IN', createdAt: AT, firstContactedAt: AT },
      { orgId: orgA, leadCode: `${RUN}-L2`, parentName: 'P2', phone: '1111111112', source: 'REFERRAL', createdAt: AT },
      { orgId: orgB, leadCode: `${RUN}-L3`, parentName: 'P3', phone: '1111111113', source: 'WALK_IN', createdAt: AT }
    ]
  })

  await prisma.admission.create({
    data: {
      orgId: orgA, admissionCode: `${RUN}-A1`, applicantName: 'Kid A',
      createdAt: AT, status: 'ADMITTED', decidedAt: AT
    }
  })

  const student = await prisma.student.create({
    data: { orgId: orgA, studentCode: `${RUN}-S1`, name: 'Kid A', status: 'ACTIVE' }
  })
  const invoice = await prisma.invoice.create({
    data: {
      orgId: orgA, invoiceNumber: `${RUN}-I1`, studentId: student.id,
      totalAmount: 1000, createdAt: AT
    }
  })
  await prisma.payment.create({
    data: {
      orgId: orgA, receiptNumber: `${RUN}-R1`, invoiceId: invoice.id,
      studentId: student.id, amount: 400, method: 'CASH',
      status: 'SUCCESS', paidAt: AT
    }
  })
  await prisma.concession.create({
    data: {
      orgId: orgA, studentId: student.id, invoiceId: invoice.id,
      type: 'FIXED_AMOUNT', value: 100, createdAt: AT
    }
  })
})

afterAll(async () => {
  if (!process.env.TEST_DATABASE_URL) return // DB suites skipped; don't touch prod
  const orgs = { orgId: { in: [orgA, orgB] } }
  await prisma.dailyRollup.deleteMany({ where: orgs })
  await prisma.concession.deleteMany({ where: orgs })
  await prisma.payment.deleteMany({ where: orgs })
  await prisma.invoice.deleteMany({ where: orgs })
  await prisma.student.deleteMany({ where: orgs })
  await prisma.admission.deleteMany({ where: orgs })
  await prisma.lead.deleteMany({ where: orgs })
  await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } })
  await prisma.$disconnect()
})

describe('istDayWindow', () => {
  it('covers the IST calendar day (UTC+5:30)', () => {
    const { start, end } = istDayWindow('2026-07-07')
    expect(start.toISOString()).toBe('2026-07-06T18:30:00.000Z')
    expect(end.toISOString()).toBe('2026-07-07T18:30:00.000Z')
  })

  it('rejects malformed dates', () => {
    expect(() => istDayWindow('07/07/2026')).toThrow()
  })
})

describeDb('rollup correctness', () => {
  it('computes the expected metrics for a known day of activity', async () => {
    const rows = await computeDailyRollups(prisma, orgA, DATE)
    const byMetric = (m: string) => rows.filter(r => r.metric === m)

    const leads = byMetric('leads_created')
    expect(leads).toHaveLength(2)
    expect(leads.find(r => r.dimensionValue === 'WALK_IN')?.count).toBe(1)
    expect(leads.find(r => r.dimensionValue === 'REFERRAL')?.count).toBe(1)

    expect(byMetric('leads_contacted')[0]?.count).toBe(1)
    expect(byMetric('admissions_started')[0]?.count).toBe(1)
    expect(byMetric('admissions_admitted')[0]?.count).toBe(1)

    const invoiced = byMetric('invoiced_amount')[0]
    expect(invoiced?.count).toBe(1)
    expect(Number(invoiced?.amount)).toBe(1000)

    const collected = byMetric('collected_amount')[0]
    expect(collected?.dimensionValue).toBe('CASH')
    expect(Number(collected?.amount)).toBe(400)

    const concession = byMetric('concession_amount')[0]
    expect(concession?.dimensionValue).toBe('FIXED_AMOUNT')
    expect(Number(concession?.amount)).toBe(100)

    expect(byMetric('students_active')[0]?.count).toBe(1)
  })

  it('excludes soft-deleted rows', async () => {
    const doomed = await prisma.lead.create({
      data: {
        orgId: orgA, leadCode: `${RUN}-DEL`, parentName: 'Gone',
        phone: '1111111119', source: 'WALK_IN', createdAt: AT,
        deletedAt: new Date()
      }
    })
    const rows = await computeDailyRollups(prisma, orgA, DATE)
    const walkIn = rows.find(
      r => r.metric === 'leads_created' && r.dimensionValue === 'WALK_IN'
    )
    expect(walkIn?.count).toBe(1)
    await prisma.lead.delete({ where: { id: doomed.id } })
  })

  it('writes no snapshot metrics for historical dates', async () => {
    const rows = await computeDailyRollups(prisma, orgA, '2020-01-01')
    expect(rows.find(r => r.metric === 'students_active')).toBeUndefined()
    expect(rows).toHaveLength(0) // no activity on that day at all
  })
})

describeDb('rollup idempotency', () => {
  it('re-running the same org×date produces identical row counts', async () => {
    const first = await rollupOrgDay(prisma, orgA, DATE)
    const countAfterFirst = await prisma.dailyRollup.count({ where: { orgId: orgA } })
    const second = await rollupOrgDay(prisma, orgA, DATE)
    const countAfterSecond = await prisma.dailyRollup.count({ where: { orgId: orgA } })

    expect(second).toBe(first)
    expect(countAfterSecond).toBe(countAfterFirst)
  })
})

describeDb('rollup tenant scoping', () => {
  it('one org’s rollup never counts another org’s activity', async () => {
    await rollupOrgDay(prisma, orgB, DATE)
    const rowsB = await prisma.dailyRollup.findMany({
      where: { orgId: orgB, metric: 'leads_created' }
    })
    expect(rowsB).toHaveLength(1)
    expect(rowsB[0].count).toBe(1) // orgB has exactly one lead
  })

  it('tenant-scoped reads of daily_rollups are org-scoped', async () => {
    const db = forOrg(orgA)
    const rows = await db.dailyRollup.findMany()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(r => r.orgId === orgA)).toBe(true)
  })
})
