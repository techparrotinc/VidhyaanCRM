import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { signMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { istDateString } from '@/lib/parent-schedule'

// This route only authenticates via Bearer JWT (never NextAuth), but
// parent-portal.ts imports '@/auth' at module scope for the web session
// path — mock it out so importing the route handler under vitest doesn't
// pull in next-auth's edge runtime module resolution.
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

const { GET } = await import('@/app/api/mobile/v1/parent/home/route')

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `mobile-home-${Date.now()}`

let orgId: string
let userId: string
let parentId: string
let studentId: string

function req(token?: string) {
  return new NextRequest('http://localhost/api/mobile/v1/parent/home', {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  })
}

beforeAll(async () => {
  process.env.MOBILE_JWT_SECRET = 'test-secret-test-secret-test-secret-1234'

  const org = await prisma.organization.create({
    data: {
      name: `${RUN}-org`,
      slug: `${RUN}-org`,
      institutionType: 'SCHOOL',
      email: `${RUN}@tenant-test.local`,
      phone: '0000000000',
      isDummy: true
    }
  })
  orgId = org.id

  const phone = `9${RUN.slice(-9)}`
  const user = await prisma.user.create({ data: { name: 'Test Parent', phone } })
  userId = user.id

  const parent = await prisma.parent.create({ data: { phone, name: 'Test Parent', userId } })
  parentId = parent.id

  const student = await prisma.student.create({
    data: {
      orgId,
      studentCode: `${RUN}-STU`,
      name: 'Test Kid',
      guardianPhone: phone,
      gradeLabel: 'Grade 5',
      section: 'A',
      status: 'ACTIVE'
    }
  })
  studentId = student.id

  await prisma.invoice.create({
    data: {
      orgId,
      invoiceNumber: `${RUN}-INV`,
      studentId,
      totalAmount: 5000,
      paidAmount: 0,
      status: 'UNPAID',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.attendanceRecord.create({
    data: {
      orgId,
      studentId,
      date: new Date(`${istDateString()}T00:00:00.000Z`),
      status: 'PRESENT'
    }
  })
})

afterAll(async () => {
  await prisma.attendanceRecord.deleteMany({ where: { studentId } })
  await prisma.invoice.deleteMany({ where: { studentId } })
  await prisma.student.deleteMany({ where: { orgId } })
  await prisma.parent.deleteMany({ where: { id: parentId } })
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.organization.deleteMany({ where: { id: orgId } })
  await prisma.$disconnect()
})

describeDb('GET /api/mobile/v1/parent/home', () => {
  it('returns kid card with attendance/fee for a valid parent JWT', async () => {
    const token = await signMobileAccessToken({
      userId,
      role: 'PARENT',
      orgId: null,
      name: 'Test Parent',
      assignmentId: '',
      deviceId: 'device-1'
    })
    const res = await GET(req(token))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    const kid = body.kids.find((k: any) => k.studentId === studentId)
    expect(kid).toBeTruthy()
    expect(kid.attendanceToday).toBe('PRESENT')
    expect(kid.nextFeeDue).toMatchObject({ balance: 5000 })
  })

  it('rejects a missing or invalid token', async () => {
    expect((await GET(req())).status).toBe(401)
    expect((await GET(req('garbage'))).status).toBe(401)
  })

  it('rejects a non-parent role', async () => {
    const token = await signMobileAccessToken({
      userId,
      role: 'ORG_ADMIN',
      orgId,
      name: 'Staff',
      assignmentId: 'a',
      deviceId: 'd'
    })
    expect((await GET(req(token))).status).toBe(403)
  })
})
