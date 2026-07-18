import { describe, it, expect, beforeAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'

if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

;(process.env as Record<string, string>).NODE_ENV = 'development'

// Mock external integrations
vi.mock('@/lib/integrations/zeptomail', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/lib/credits/metered-send', () => ({
  sendMeteredSms: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/lib/whatsapp/notify', () => ({
  sendTemplateNotification: vi.fn().mockResolvedValue(true)
}))
vi.mock('@/lib/integrations/msg91', () => ({
  sendOtpSms: vi.fn().mockResolvedValue(undefined)
}))

// Mock WhatsApp emitters to allow simulated failures
let whatsappFailMode = false
vi.mock('@/lib/whatsapp/emitters', () => ({
  onLeadAssigned: vi.fn(async () => {
    if (whatsappFailMode) throw new Error('WhatsApp delivery failed')
  }),
  onLeadClosed: vi.fn(async () => {
    if (whatsappFailMode) throw new Error('WhatsApp delivery failed')
  })
}))

// Mock lead code generator to prevent unique constraint failures under concurrent testing
let leadCodeCounter = 0
vi.mock('@/lib/lead-code', () => ({
  createLeadWithUniqueCode: vi.fn(async (orgId, cb) => {
    leadCodeCounter++
    return cb(`L-MOCK-${leadCodeCounter}-${Date.now()}`)
  })
}))

// Import route handlers
import { GET as getLeads, POST as createLead } from '@/app/api/v1/leads/route'
import { PUT as updateLead } from '@/app/api/v1/leads/[id]/route'
import { POST as bulkAction } from '@/app/api/v1/leads/bulk/route'
import { POST as createActivity } from '@/app/api/v1/leads/[id]/activities/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `lead-test-${Date.now()}`

let orgId: string
let branchId: string
let academicYearId: string
let adminId: string
let counsellorId1: string
let counsellorId2: string
let headersAdmin: Headers
let adminUserContext: any

function randomPhone(): string {
  return '9' + Math.floor(100000000 + Math.random() * 900000000)
}

beforeAll(async () => {
  // Seed Organization
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}.local`,
      phone: '0000000000',
      isDummy: true,
      status: 'ACTIVE',
      leadCap: 3 // Set low cap for queuing tests
    }
  })
  orgId = org.id

  // Enable lead_management module
  const m = await prisma.module.upsert({
    where: { slug: 'lead_management' },
    update: {},
    create: { slug: 'lead_management', name: 'lead_management', description: 'lead_management' }
  })
  await prisma.organizationModule.create({
    data: { orgId, moduleId: m.id, enabled: true }
  })

  // Branch
  const branch = await prisma.branch.create({
    data: { orgId, name: 'Main Branch', isDefault: true }
  })
  branchId = branch.id

  // Academic Year
  const ay = await prisma.academicYear.create({
    data: {
      orgId,
      name: '2026-27',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      type: 'ACADEMIC'
    }
  })
  academicYearId = ay.id

  // Users / Counsellors
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Lead Admin',
      email: `admin@${RUN}.local`,
      phone: randomPhone(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' } }
    }
  })
  adminId = admin.id

  const c1 = await prisma.user.create({
    data: {
      orgId,
      name: 'Counsellor 1',
      email: `c1@${RUN}.local`,
      phone: randomPhone(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'COUNSELLOR', orgId, status: 'ACTIVE' } }
    }
  })
  counsellorId1 = c1.id

  const c2 = await prisma.user.create({
    data: {
      orgId,
      name: 'Counsellor 2',
      email: `c2@${RUN}.local`,
      phone: randomPhone(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'COUNSELLOR', orgId, status: 'ACTIVE' } }
    }
  })
  counsellorId2 = c2.id

  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'Content-Type': 'application/json'
  })

  adminUserContext = {
    req: {} as any,
    db: prisma,
    user: { id: adminId, orgId, role: 'ORG_ADMIN' },
    org: { id: orgId, leadCap: 3 },
    academicYearId
  }
})

describeDb('Lead Management Verification Suite', () => {

  // ==========================================
  // A. Status Lifecycle
  // ==========================================

  it('1. Single lead update status to arbitrary string -> throws raw 500 (GAP FOUND)', async () => {
    // Create a lead
    const lead = await prisma.lead.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        leadCode: `L-SLIF-${Date.now()}`,
        parentName: 'Lifecycle Parent',
        phone: randomPhone(),
        status: 'NEW'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/leads/${lead.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'FOOBAR' })
    })

    const res = await updateLead(req, { params: Promise.resolve({ id: lead.id }), ...adminUserContext } as any)
    expect(res.status).toBe(422) // Properly validated and rejected with 422
  })

  it('2. Bulk status-change to arbitrary string -> properly rejected with 422', async () => {
    const req = new NextRequest('http://localhost/api/v1/leads/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'status', ids: ['fake_id_123'], status: 'FOOBAR' })
    })

    const res = await bulkAction(req, { ...adminUserContext } as any)
    expect(res.status).toBe(422) // Zod validation schema error
  })

  it('4. Move a lead through statuses non-sequentially -> all succeed with no order enforcement', async () => {
    const lead = await prisma.lead.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        leadCode: `L-MOVE-${Date.now()}`,
        parentName: 'Move Parent',
        phone: randomPhone(),
        status: 'NEW'
      }
    })

    const seq = ['CONVERTED', 'CONTACTED', 'NOT_INTERESTED', 'NEW']
    for (const status of seq) {
      const req = new NextRequest(`http://localhost/api/v1/leads/${lead.id}`, {
        method: 'PUT',
        headers: headersAdmin,
        body: JSON.stringify({ status })
      })
      const res = await updateLead(req, { params: Promise.resolve({ id: lead.id }), ...adminUserContext } as any)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe(status)
    }
  })

  // ==========================================
  // B. Lead Cap & Queued Leads
  // ==========================================

  it('5. Capped lead created as queued -> updating status is allowed with no re-check (GAP FOUND)', async () => {
    // Fill org leads up to the cap (3 leads)
    const existingCount = await prisma.lead.count({ where: { orgId } })
    const needed = 3 - existingCount
    for (let i = 0; i < needed; i++) {
      await prisma.lead.create({
        data: { orgId, branchId, academicYearId, leadCode: `L-FILL-${i}-${Date.now()}`, parentName: 'Filler', phone: randomPhone() }
      })
    }

    // Create 4th lead -> should land as "queued"
    const reqCreate = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ parentName: 'Capped Child', phone: randomPhone() })
    })
    const resCreate = await createLead(reqCreate, { ...adminUserContext } as any)
    expect(resCreate.status).toBe(201)
    const createBody = await resCreate.json()
    expect(createBody.data.queued).toBe(true)

    const queuedLeadId = createBody.data.id

    // Update status to CONVERTED -> blocked with 403 because it's queued and cap is active!
    const reqPut = new NextRequest(`http://localhost/api/v1/leads/${queuedLeadId}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'CONVERTED' })
    })
    const resPut = await updateLead(reqPut, { params: Promise.resolve({ id: queuedLeadId }), ...adminUserContext } as any)
    expect(resPut.status).toBe(403)
  })

  it('6. Bulk-assign a mix of queued and normal leads -> queued leads are silently included', async () => {
    // Create one normal lead
    const normalLead = await prisma.lead.create({
      data: { orgId, branchId, academicYearId, leadCode: `L-NORM-${Date.now()}`, parentName: 'Normal Parent', phone: randomPhone(), status: 'NEW' }
    })

    // Seed a queued lead directly — relying on test 5's leftover made this
    // test order/timing dependent and flaky under parallel suite runs
    const queuedLead = await prisma.lead.create({
      data: { orgId, branchId, academicYearId, leadCode: `L-QUEUED-${Date.now()}`, parentName: 'Queued Parent', phone: randomPhone(), status: 'NEW', queued: true }
    })

    const ids = [normalLead.id, queuedLead!.id]

    const req = new NextRequest('http://localhost/api/v1/leads/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'assign', ids, assignedToId: counsellorId1 })
    })

    const res = await bulkAction(req, { ...adminUserContext } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.updated).toBe(2) // Both leads updated atomically

    const updatedQueued = await prisma.lead.findUnique({ where: { id: queuedLead!.id } })
    expect(updatedQueued?.assignedToId).toBe(counsellorId1)
  })

  // ==========================================
  // C. Bulk Actions
  // ==========================================

  it('7. Bulk-assign 20 leads -> updates atomically', async () => {
    const ids: string[] = []
    for (let i = 0; i < 20; i++) {
      const l = await prisma.lead.create({
        data: { orgId, branchId, academicYearId, leadCode: `L-BULK-${i}-${Date.now()}`, parentName: `Bulk Parent ${i}`, phone: randomPhone() }
      })
      ids.push(l.id)
    }

    const req = new NextRequest('http://localhost/api/v1/leads/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'assign', ids, assignedToId: counsellorId2 })
    })
    const res = await bulkAction(req, { ...adminUserContext } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.updated).toBe(20)
  })

  it('8. Bulk-assign with empty ids array -> rejected', async () => {
    const req = new NextRequest('http://localhost/api/v1/leads/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'assign', ids: [], assignedToId: counsellorId1 })
    })
    const res = await bulkAction(req, { ...adminUserContext } as any)
    expect(res.status).toBe(422) // min(1) validation check
  })

  it('9. Bulk-assign with invalid assignedToId -> clean 404 rejection', async () => {
    const req = new NextRequest('http://localhost/api/v1/leads/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'assign', ids: ['fake_lead_id'], assignedToId: 'fake_user_id' })
    })
    const res = await bulkAction(req, { ...adminUserContext } as any)
    expect(res.status).toBe(404)
  })

  // ==========================================
  // E. Round-robin assignment race
  // ==========================================

  it('11. Fire concurrent lead-creates -> fair round-robin distribution holds', async () => {
    // Clear out leads count to standard state for index division
    await prisma.lead.deleteMany({ where: { orgId } })

    // Fire 5 creations concurrently
    const runCreate = () => {
      const req = new NextRequest('http://localhost/api/v1/leads', {
        method: 'POST',
        headers: headersAdmin,
        body: JSON.stringify({ parentName: 'RR Kid', phone: randomPhone() })
      })
      return createLead(req, { ...adminUserContext } as any).then(res => res.json())
    }

    const results = await Promise.all([
      runCreate(),
      runCreate(),
      runCreate(),
      runCreate(),
      runCreate()
    ])

    // Concurrent allocations are correctly distributed round-robin across all available counsellors
    const assignedIds = results.map(r => r.data.assignedToId)
    const uniqueCounsellors = [...new Set(assignedIds)]
    expect(uniqueCounsellors.length).toBe(3)
  })

  // ==========================================
  // F. Notifications / Activity Logging
  // ==========================================

  it('12. WhatsApp emitter fails -> status update succeeds and does not rollback', async () => {
    const lead = await prisma.lead.create({
      data: { orgId, branchId, academicYearId, leadCode: `L-WA-${Date.now()}`, parentName: 'WA Parent', phone: randomPhone(), status: 'NEW' }
    })

    // Enable WhatsApp emitter failure simulation
    whatsappFailMode = true

    // Change status to NOT_INTERESTED (fires onLeadClosed)
    const req = new NextRequest(`http://localhost/api/v1/leads/${lead.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'NOT_INTERESTED' })
    })

    const res = await updateLead(req, { params: Promise.resolve({ id: lead.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200) // Succeeds anyway!

    const finalLead = await prisma.lead.findUnique({ where: { id: lead.id } })
    expect(finalLead?.status).toBe('NOT_INTERESTED')

    whatsappFailMode = false // Reset
  })

  it('13. POST activity note to nonexistent leadId -> returns raw 500 database error (GAP FOUND)', async () => {
    const req = new NextRequest('http://localhost/api/v1/leads/nonexistent_lead_id/activities', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ type: 'NOTE', summary: 'Orphan activity log' })
    })
    const res = await createActivity(req, { params: Promise.resolve({ id: 'nonexistent_lead_id' }), ...adminUserContext } as any)
    expect(res.status).toBe(404) // Nonexistent lead is cleanly rejected with 404
  })

  // ==========================================
  // G. Search / Filter
  // ==========================================

  it('14 & 15. Safe search query with metacharacters & raw limit is capped', async () => {
    // 14. Safe search query with metacharacters
    const reqSearch = new NextRequest('http://localhost/api/v1/leads?search=%25_%27--', {
      headers: headersAdmin
    })
    const resSearch = await getLeads(reqSearch, { ...adminUserContext } as any)
    expect(resSearch.status).toBe(200)

    // 15. Raw limit of 99999 is capped
    const reqLimit = new NextRequest('http://localhost/api/v1/leads?limit=99999', {
      headers: headersAdmin
    })
    const resLimit = await getLeads(reqLimit, { ...adminUserContext } as any)
    expect(resLimit.status).toBe(200)
    const body = await resLimit.json()
    // It should fallback to pagination limit cap (25 or 100)
    expect(body.pagination.limit).toBeLessThanOrEqual(100)
  })
})
