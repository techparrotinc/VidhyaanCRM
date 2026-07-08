import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { computeDailyRollups, istDayWindow, istDateString } from '@/lib/reports/rollup'
import { backfillRollupRange } from '@/lib/reports/rollup-backfill'

// The set-based backfill and the per-day cron path implement the same metric
// definitions twice (SQL vs Prisma groupBy). This suite pins them together:
// same fixture, both paths, identical rows.

const RUN = `rollbf-test-${Date.now()}`
// A past IST day, far from today so the snapshot metric stays out of play.
const DATE = istDateString(new Date(Date.now() - 30 * 864e5))
const AT = new Date(istDayWindow(DATE).start.getTime() + 10 * 60 * 60 * 1000)

let orgId: string

beforeAll(async () => {
  const org = await prisma.organization.create({
    data: {
      name: RUN, slug: RUN, institutionType: 'SCHOOL',
      email: `${RUN}@test.local`, phone: '0', isDummy: true
    }
  })
  orgId = org.id

  await prisma.lead.createMany({
    data: [
      { orgId, leadCode: `${RUN}-1`, parentName: 'A', phone: '1000000001', source: 'WALK_IN', createdAt: AT, firstContactedAt: AT },
      { orgId, leadCode: `${RUN}-2`, parentName: 'B', phone: '1000000002', source: 'WALK_IN', createdAt: AT },
      { orgId, leadCode: `${RUN}-3`, parentName: 'C', phone: '1000000003', source: 'REFERRAL', createdAt: AT },
      // soft-deleted — both paths must ignore it
      { orgId, leadCode: `${RUN}-4`, parentName: 'D', phone: '1000000004', source: 'WALK_IN', createdAt: AT, deletedAt: new Date() }
    ]
  })
  await prisma.admission.create({
    data: {
      orgId, admissionCode: `${RUN}-A`, applicantName: 'Kid',
      createdAt: AT, status: 'ADMITTED', decidedAt: AT
    }
  })
  const student = await prisma.student.create({
    data: { orgId, studentCode: `${RUN}-S`, name: 'Kid', status: 'ACTIVE' }
  })
  const invoice = await prisma.invoice.create({
    data: { orgId, invoiceNumber: `${RUN}-I`, studentId: student.id, totalAmount: 2500, createdAt: AT }
  })
  await prisma.payment.create({
    data: {
      orgId, receiptNumber: `${RUN}-R`, invoiceId: invoice.id,
      amount: 750, method: 'UPI', status: 'SUCCESS', paidAt: AT
    }
  })
  await prisma.concession.create({
    data: { orgId, studentId: student.id, type: 'FIXED_AMOUNT', value: 200, createdAt: AT }
  })
})

afterAll(async () => {
  await prisma.dailyRollup.deleteMany({ where: { orgId } })
  await prisma.concession.deleteMany({ where: { orgId } })
  await prisma.payment.deleteMany({ where: { orgId } })
  await prisma.invoice.deleteMany({ where: { orgId } })
  await prisma.student.deleteMany({ where: { orgId } })
  await prisma.admission.deleteMany({ where: { orgId } })
  await prisma.lead.deleteMany({ where: { orgId } })
  await prisma.organization.delete({ where: { id: orgId } })
  await prisma.$disconnect()
})

type Row = {
  metric: string
  dimension: string | null
  dimensionValue: string | null
  count: number
  amount: number | null
}

const normalize = (rows: Row[]) =>
  rows
    .map(r => ({
      metric: r.metric,
      dimension: r.dimension,
      dimensionValue: r.dimensionValue,
      count: r.count,
      amount: r.amount === null ? null : Number(r.amount)
    }))
    .sort((a, b) =>
      `${a.metric}|${a.dimensionValue}`.localeCompare(`${b.metric}|${b.dimensionValue}`)
    )

describe('set-based backfill ↔ per-day cron parity', () => {
  it('produces identical rows for the same fixture day', async () => {
    const perDay = await computeDailyRollups(prisma, orgId, DATE)

    const written = await backfillRollupRange(prisma as never, {
      from: DATE, to: DATE, orgId
    })
    expect(written).toBeGreaterThan(0)

    const stored = await prisma.dailyRollup.findMany({
      where: { orgId, date: new Date(`${DATE}T00:00:00Z`) },
      select: {
        metric: true, dimension: true, dimensionValue: true,
        count: true, amount: true
      }
    })

    expect(normalize(stored as never)).toEqual(normalize(perDay as never))
  })

  it('expected fixture numbers survive both paths', async () => {
    const stored = await prisma.dailyRollup.findMany({ where: { orgId } })
    const walkIn = stored.find(r => r.metric === 'leads_created' && r.dimensionValue === 'WALK_IN')
    expect(walkIn?.count).toBe(2) // soft-deleted lead excluded
    const collected = stored.find(r => r.metric === 'collected_amount')
    expect(collected?.dimensionValue).toBe('UPI')
    expect(Number(collected?.amount)).toBe(750)
    expect(stored.find(r => r.metric === 'students_active')).toBeUndefined() // past day, no snapshot
  })

  it('re-running the range is idempotent', async () => {
    const before = await prisma.dailyRollup.count({ where: { orgId } })
    await backfillRollupRange(prisma as never, { from: DATE, to: DATE, orgId })
    const after = await prisma.dailyRollup.count({ where: { orgId } })
    expect(after).toBe(before)
  })
})
