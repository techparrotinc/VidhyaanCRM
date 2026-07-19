import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'

import { POST as recordPayment } from '@/app/api/v1/fees/invoices/[id]/payments/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `fee-race-${Date.now()}`

let orgId: string
let adminId: string
let studentId: string
let headersAdmin: Headers

beforeAll(async () => {
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}.local`,
      phone: '0000000000',
      isDummy: true,
      status: 'ACTIVE'
    }
  })
  orgId = org.id

  let feeMod = await prisma.module.findFirst({ where: { slug: 'fee_management' } })
  if (!feeMod) {
    feeMod = await prisma.module.create({
      data: { name: 'Fee Management', slug: 'fee_management' }
    })
  }
  await prisma.organizationModule.create({
    data: { orgId, moduleId: feeMod.id, enabled: true, enabledAt: new Date() }
  })

  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Race Admin',
      email: `admin-user@${RUN}.local`,
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' }
      }
    }
  })
  adminId = admin.id

  const student = await prisma.student.create({
    data: { orgId, name: `${RUN}-student`, studentCode: `${RUN}-STU-1` }
  })
  studentId = student.id

  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'x-user-name': 'Race Admin',
    'Content-Type': 'application/json'
  })
})

afterAll(async () => {
  if (orgId) {
    await prisma.ledgerEntry.deleteMany({ where: { orgId } })
    await prisma.payment.deleteMany({ where: { orgId } })
    await prisma.invoice.deleteMany({ where: { orgId } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

function payReq(invoiceId: string, amount: number, method: 'CASH' | 'UPI') {
  return new NextRequest(`http://localhost/api/v1/fees/invoices/${invoiceId}/payments`, {
    method: 'POST',
    headers: headersAdmin,
    body: JSON.stringify({ amount, method })
  })
}

async function createInvoice(number: string, total: number) {
  return prisma.invoice.create({
    data: {
      orgId,
      studentId,
      invoiceNumber: number,
      totalAmount: total,
      status: 'UNPAID'
    }
  })
}

describeDb('Invoice payment double-settle race', () => {
  it('two concurrent full-amount payments settle exactly once', async () => {
    const invoice = await createInvoice(`${RUN}-INV-1`, 3500)
    const params = Promise.resolve({ id: invoice.id })

    const [res1, res2] = await Promise.all([
      recordPayment(payReq(invoice.id, 3500, 'CASH'), { params }),
      recordPayment(payReq(invoice.id, 3500, 'UPI'), { params })
    ])

    const statuses = [res1.status, res2.status].sort()
    expect(statuses).toEqual([201, 422])

    const payments = await prisma.payment.findMany({
      where: { invoiceId: invoice.id, deletedAt: null }
    })
    expect(payments).toHaveLength(1)

    const after = await prisma.invoice.findUnique({ where: { id: invoice.id } })
    expect(Number(after!.paidAmount)).toBe(3500)
    expect(after!.status).toBe('PAID')
  })

  it('concurrent partial payments never exceed the invoice total', async () => {
    const invoice = await createInvoice(`${RUN}-INV-2`, 3000)
    const params = Promise.resolve({ id: invoice.id })

    // Three parallel 2000-payments against a 3000 invoice: only one fits.
    const results = await Promise.all([
      recordPayment(payReq(invoice.id, 2000, 'CASH'), { params }),
      recordPayment(payReq(invoice.id, 2000, 'UPI'), { params }),
      recordPayment(payReq(invoice.id, 2000, 'CASH'), { params })
    ])

    const okCount = results.filter((r) => r.status === 201).length
    expect(okCount).toBe(1)

    const after = await prisma.invoice.findUnique({ where: { id: invoice.id } })
    expect(Number(after!.paidAmount)).toBeLessThanOrEqual(3000)
  })

  it('sequential partial then remainder still works (no over-locking)', async () => {
    const invoice = await createInvoice(`${RUN}-INV-3`, 2000)
    const params = Promise.resolve({ id: invoice.id })

    const first = await recordPayment(payReq(invoice.id, 1200, 'CASH'), { params })
    expect(first.status).toBe(201)
    const second = await recordPayment(payReq(invoice.id, 800, 'UPI'), { params })
    expect(second.status).toBe(201)

    const after = await prisma.invoice.findUnique({ where: { id: invoice.id } })
    expect(Number(after!.paidAmount)).toBe(2000)
    expect(after!.status).toBe('PAID')
  })
})
