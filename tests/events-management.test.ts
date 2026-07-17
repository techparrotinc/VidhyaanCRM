import { describe, it, expect, beforeAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'

if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

;(process.env as Record<string, string>).NODE_ENV = 'development'

// Mock external integrations & tracking
const emailSends: any[] = []
const smsSends: any[] = []
const whatsappSends: any[] = []

vi.mock('@/lib/integrations/zeptomail', () => ({
  sendTransactionalEmail: vi.fn(async (payload) => {
    emailSends.push(payload)
  })
}))
vi.mock('@/lib/credits/metered-send', () => ({
  sendMeteredSms: vi.fn(async (orgId, phone, msg, ref) => {
    smsSends.push({ orgId, phone, msg, ref })
  })
}))
vi.mock('@/lib/whatsapp/notify', () => ({
  sendTemplateNotification: vi.fn(async (payload) => {
    whatsappSends.push(payload)
    return true
  })
}))
vi.mock('@/lib/integrations/msg91', () => ({
  sendOtpSms: vi.fn().mockResolvedValue(undefined)
}))

// Import route handlers
import { POST as createEvent } from '@/app/api/v1/events/route'
import { PUT as updateEvent, DELETE as deleteEvent } from '@/app/api/v1/events/[id]/route'
import { PUT as updateEventStatus } from '@/app/api/v1/events/[id]/status/route'
import { POST as announceEvent } from '@/app/api/v1/events/[id]/announce/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `event-test-${Date.now()}`

let orgId: string
let branchId: string
let academicYearId: string
let adminId: string
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
      status: 'ACTIVE'
    }
  })
  orgId = org.id

  // Enable event_management module
  const m = await prisma.module.upsert({
    where: { slug: 'event_management' },
    update: {},
    create: { slug: 'event_management', name: 'event_management', description: 'event_management' }
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

  // User Admin
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Event Admin',
      email: `admin@${RUN}.local`,
      phone: randomPhone(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' } }
    }
  })
  adminId = admin.id

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
    org: { id: orgId },
    academicYearId
  }
})

describeDb('Events Lifecycle & Announce Verification Suite', () => {

  // ==========================================
  // A. Lifecycle
  // ==========================================

  it('1. Create DRAFT event & edit succeeds -> DRAFT is fully editable', async () => {
    // 1. Create DRAFT event
    const starts = new Date(Date.now() + 86400000).toISOString() // Tomorrow
    const reqCreate = new NextRequest('http://localhost/api/v1/events', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        title: 'Draft Tour',
        startsAt: starts,
        status: 'DRAFT',
        branchId,
        academicYearId
      })
    })

    const draftEvent = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Draft Tour',
        startsAt: new Date(starts),
        status: 'DRAFT'
      }
    })

    // Edit it
    const reqEdit = new NextRequest(`http://localhost/api/v1/events/${draftEvent.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ title: 'Draft Tour Edited', location: 'Campus Gate A' })
    })

    const resEdit = await updateEvent(reqEdit, { params: Promise.resolve({ id: draftEvent.id }), ...adminUserContext } as any)
    expect(resEdit.status).toBe(200)
    const body = await resEdit.json()
    expect(body.data.title).toBe('Draft Tour Edited')
    expect(body.data.location).toBe('Campus Gate A')
  })

  it('2 & 3. Publish DRAFT event in future succeeds & cancel CANCELLED event works', async () => {
    // Seed draft event in the future
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Future Event',
        startsAt: new Date(Date.now() + 2 * 86400000), // 2 days in future
        status: 'DRAFT'
      }
    })

    // 2. Publish DRAFT event
    const reqPub = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'publish' })
    })
    const resPub = await updateEventStatus(reqPub, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(resPub.status).toBe(200)
    const bodyPub = await resPub.json()
    expect(bodyPub.data.status).toBe('PUBLISHED')
    expect(bodyPub.data.publishedAt).not.toBeNull()

    // 3. Cancel PUBLISHED event
    const reqCancel = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'cancel' })
    })
    const resCancel = await updateEventStatus(reqCancel, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(resCancel.status).toBe(200)
    const bodyCancel = await resCancel.json()
    expect(bodyCancel.data.status).toBe('CANCELLED')
  })

  it('4. Try to edit a PUBLISHED event -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Locked Event',
        startsAt: new Date(Date.now() + 86400000),
        status: 'PUBLISHED'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ title: 'Hacked Title' })
    })
    const res = await updateEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('5. Try to publish a DRAFT event starting in the past -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Past Event',
        startsAt: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'DRAFT'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'publish' })
    })
    const res = await updateEventStatus(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('6. Try to publish an already-PUBLISHED event -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Repeated Publish',
        startsAt: new Date(Date.now() + 86400000),
        status: 'PUBLISHED'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'publish' })
    })
    const res = await updateEventStatus(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('7. Try to cancel a DRAFT event -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Cancel Draft',
        startsAt: new Date(Date.now() + 86400000),
        status: 'DRAFT'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'cancel' })
    })
    const res = await updateEventStatus(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('8. Try to cancel an already-CANCELLED event -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Double Cancel',
        startsAt: new Date(Date.now() + 86400000),
        status: 'CANCELLED'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'cancel' })
    })
    const res = await updateEventStatus(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('11. Fire concurrent publish status-changes -> both read status DRAFT concurrently and succeed (GAP FOUND)', async () => {
    const event = await prisma.event.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        title: 'Race Publish',
        startsAt: new Date(Date.now() + 86400000),
        status: 'DRAFT'
      }
    })

    const req1 = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'publish' })
    })
    const req2 = new NextRequest(`http://localhost/api/v1/events/${event.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ action: 'publish' })
    })

    const [res1, res2] = await Promise.all([
      updateEventStatus(req1, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any),
      updateEventStatus(req2, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    ])

    // One succeeds with 200, the other blocks with 409
    expect([res1.status, res2.status]).toContain(200)
    expect([res1.status, res2.status]).toContain(409)
  })

  // ==========================================
  // B. Delete
  // ==========================================

  it('12. Delete DRAFT event -> soft deletes successfully', async () => {
    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Trash Event', startsAt: new Date(Date.now() + 86400000), status: 'DRAFT' }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}`, { method: 'DELETE', headers: headersAdmin })
    const res = await deleteEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200)

    // Verify row still exists in DB but contains deletedAt timestamp
    const rawRow = await prisma.event.findFirst({
      where: { id: event.id }
    })
    expect(rawRow?.deletedAt).not.toBeNull()
  })

  it('13. Try to delete a PUBLISHED event -> blocked with 409', async () => {
    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Trash Published', startsAt: new Date(Date.now() + 86400000), status: 'PUBLISHED' }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}`, { method: 'DELETE', headers: headersAdmin })
    const res = await deleteEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(409)
  })

  it('14. Delete a CANCELLED event -> successfully allowed', async () => {
    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Trash Cancelled', startsAt: new Date(Date.now() + 86400000), status: 'CANCELLED' }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}`, { method: 'DELETE', headers: headersAdmin })
    const res = await deleteEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200)

    const rawRow = await prisma.event.findFirst({ where: { id: event.id } })
    expect(rawRow?.deletedAt).not.toBeNull()
  })

  // ==========================================
  // D. Announce
  // ==========================================

  it('17. Announce "ALL" audience via PORTAL & EMAIL -> sends out with no credit checks', async () => {
    emailSends.length = 0
    smsSends.length = 0

    // Seed student & lead
    await prisma.student.create({
      data: { orgId, branchId, academicYearId, studentCode: `S-ANN1-${Date.now()}`, name: 'Ward 1', guardianPhone: randomPhone(), guardianEmail: 'p1@gmail.com', status: 'ACTIVE' }
    })
    await prisma.lead.create({
      data: { orgId, branchId, academicYearId, leadCode: `L-ANN2-${Date.now()}`, parentName: 'Lead P1', phone: randomPhone(), email: 'l1@gmail.com', status: 'NEW' }
    })

    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'School Carnival', startsAt: new Date(Date.now() + 86400000), status: 'PUBLISHED' }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/announce`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        audience: 'ALL',
        channels: ['PORTAL', 'EMAIL']
      })
    })

    const res = await announceEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.sent).toBeGreaterThanOrEqual(2) // Parent + Lead emails sent
    expect(emailSends.length).toBeGreaterThanOrEqual(2)
    expect(smsSends.length).toBe(0) // No SMS credits debited
  })

  it('18 & 20. Announce CUSTOM audience resolves & dedupes, debits SMS metered send correctly', async () => {
    smsSends.length = 0

    const pPhone = randomPhone()
    const student = await prisma.student.create({
      data: { orgId, branchId, academicYearId, studentCode: `S-CUS-${Date.now()}`, name: 'Cus Student', guardianPhone: pPhone, status: 'ACTIVE' }
    })

    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Specific Meet', startsAt: new Date(Date.now() + 86400000), status: 'PUBLISHED' }
    })

    // Custom audience matching student
    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/announce`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        audience: 'CUSTOM',
        channels: ['SMS'],
        recipients: [
          { type: 'STUDENT', id: student.id },
          { type: 'STUDENT', id: student.id } // Duplicate recipient hand-picked
        ]
      })
    })

    const res = await announceEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.recipients).toBe(1) // Correctly deduped to 1 recipient
    expect(body.data.sent).toBe(1)
    expect(smsSends.length).toBe(1) // Single metered SMS credit debited
    expect(smsSends[0].phone).toBe(pPhone)
  })

  it('19. Announce via WhatsApp templates -> silently no-ops when not approved', async () => {
    whatsappSends.length = 0

    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Watsapp Meet', startsAt: new Date(Date.now() + 86400000), status: 'PUBLISHED' }
    })

    const req = new NextRequest(`http://localhost/api/v1/events/${event.id}/announce`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        audience: 'ALL',
        channels: ['WHATSAPP']
      })
    })

    const res = await announceEvent(req, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    expect(res.status).toBe(200) // Silent success
  })

  it('22. Double-announce race -> double-send credits debited & duplicate audit rows created (GAP FOUND)', async () => {
    // Clean up all students and leads for this organization to guarantee exactly 1 recipient
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.lead.deleteMany({ where: { orgId } })

    smsSends.length = 0

    const student = await prisma.student.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        studentCode: `S-DBL-${Date.now()}`,
        name: 'Double Ward',
        guardianPhone: randomPhone(),
        status: 'ACTIVE'
      }
    })

    const event = await prisma.event.create({
      data: { orgId, branchId, academicYearId, title: 'Spam Tour', startsAt: new Date(Date.now() + 86400000), status: 'PUBLISHED' }
    })

    const req1 = new NextRequest(`http://localhost/api/v1/events/${event.id}/announce`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        audience: 'PARENTS',
        channels: ['SMS']
      })
    })

    const req2 = new NextRequest(`http://localhost/api/v1/events/${event.id}/announce`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        audience: 'PARENTS',
        channels: ['SMS']
      })
    })

    // Concurrent double-post
    const [res1, res2] = await Promise.all([
      announceEvent(req1, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any),
      announceEvent(req2, { params: Promise.resolve({ id: event.id }), ...adminUserContext } as any)
    ])

    // One succeeds, the other is blocked with 422
    expect([res1.status, res2.status]).toContain(200)
    expect([res1.status, res2.status]).toContain(422)

    // Single audit row in db
    const auditRows = await prisma.eventAnnouncement.findMany({
      where: { eventId: event.id }
    })
    expect(auditRows.length).toBe(1)

    // Single credit charged
    expect(smsSends.length).toBe(1)
  })
})
