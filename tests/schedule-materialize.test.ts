import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { effectiveDurationMin, materializeBatch, MATERIALIZE_HORIZON_DAYS } from '@/lib/schedule/materialize'

describe('effectiveDurationMin (pure)', () => {
  it('prefers the explicit sessionDurationMin', () => {
    expect(effectiveDurationMin({ sessionDurationMin: 45, startTime: '09:00', endTime: '10:00' })).toBe(45)
  })

  it('falls back to the startTime/endTime diff', () => {
    expect(effectiveDurationMin({ sessionDurationMin: null, startTime: '09:00', endTime: '09:30' })).toBe(30)
  })

  it('falls back to 60 when neither is usable', () => {
    expect(effectiveDurationMin({ sessionDurationMin: null, startTime: null, endTime: null })).toBe(60)
    expect(effectiveDurationMin({ sessionDurationMin: 0, startTime: '10:00', endTime: '09:00' })).toBe(60) // end before start
  })
})

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL) // no test DB -> skip, never touch prod

const RUN = `schedule-materialize-${Date.now()}`

let orgId: string
let batchId: string

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) return
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'LEARNING_CENTER',
      email: `${RUN}@schedule-test.local`,
      phone: '0000000000',
      isDummy: true
    }
  })
  orgId = org.id

  // Mon/Wed/Fri 09:00–10:00, spanning today so the fixed "today" run below
  // always materializes at least one occurrence regardless of weekday.
  const today = new Date()
  const batch = await prisma.studentBatch.create({
    data: {
      orgId,
      name: 'Test Batch',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      startTime: '09:00',
      endTime: '10:00',
      isActive: true
    }
  })
  batchId = batch.id
  void today
})

afterAll(async () => {
  if (!process.env.TEST_DATABASE_URL) return
  await prisma.courseSession.deleteMany({ where: { orgId } })
  await prisma.attendanceSession.deleteMany({ where: { orgId } })
  await prisma.studentBatch.deleteMany({ where: { orgId } })
  await prisma.organization.deleteMany({ where: { id: orgId } })
  await prisma.$disconnect()
})

describeDb('materializeBatch idempotency', () => {
  it('materializes ~2 weeks of occurrences (every day matched)', async () => {
    const batch = await prisma.studentBatch.findUniqueOrThrow({ where: { id: batchId } })
    const created = await materializeBatch(prisma, batch)
    expect(created).toBe(MATERIALIZE_HORIZON_DAYS + 1) // offset 0..horizonDays inclusive

    const sessions = await prisma.courseSession.findMany({ where: { batchId } })
    expect(sessions).toHaveLength(MATERIALIZE_HORIZON_DAYS + 1)
    // Each materialized session carries its own 1:1 attendance session.
    expect(sessions.every(s => !!s.attendanceSessionId)).toBe(true)
  })

  it('a second run creates nothing (idempotent on batchId+startsAt)', async () => {
    const batch = await prisma.studentBatch.findUniqueOrThrow({ where: { id: batchId } })
    const created = await materializeBatch(prisma, batch)
    expect(created).toBe(0)

    const sessions = await prisma.courseSession.findMany({ where: { batchId } })
    expect(sessions).toHaveLength(MATERIALIZE_HORIZON_DAYS + 1)
  })

  it('never resurrects or overwrites a one-off cancel already on that slot', async () => {
    const [firstSession] = await prisma.courseSession.findMany({
      where: { batchId },
      orderBy: { startsAt: 'asc' },
      take: 1
    })
    await prisma.courseSession.update({
      where: { id: firstSession.id },
      data: { status: 'CANCELLED', cancelReason: 'Public holiday' }
    })

    const batch = await prisma.studentBatch.findUniqueOrThrow({ where: { id: batchId } })
    const created = await materializeBatch(prisma, batch)
    expect(created).toBe(0)

    const reread = await prisma.courseSession.findUnique({ where: { id: firstSession.id } })
    expect(reread?.status).toBe('CANCELLED')
    expect(reread?.cancelReason).toBe('Public holiday')

    const sessions = await prisma.courseSession.findMany({ where: { batchId } })
    expect(sessions).toHaveLength(MATERIALIZE_HORIZON_DAYS + 1) // no duplicate/extra row for that slot
  })
})
