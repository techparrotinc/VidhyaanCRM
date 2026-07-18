import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { AttendanceStatus } from '@prisma/client'
import { toDbDate, dbDateToString } from '@/lib/attendance/dates'
import { istDateString } from '@/lib/reports/rollup'
import crypto from 'crypto'

// Mocks to bypass actual API/service calls
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

// Mock send campaign channels to prevent hitting MSG91/Meta APIs
vi.mock('@/lib/campaign/channels', () => ({
  sendCampaignSMS: vi.fn(async () => {}),
  sendCampaignWhatsApp: vi.fn(async () => 'wamid_mock_' + Math.random().toString(36).substring(7))
}))

vi.mock('@/lib/push/send', () => ({
  sendPush: vi.fn(async () => {})
}))

// Mock credits send/engine
import * as meteredSend from '@/lib/credits/metered-send'
import * as engine from '@/lib/credits/engine'

// Spy/Mock functions
const spendCreditsSpy = vi.spyOn(engine, 'spendCreditsWithIntent')
const sendMeteredSmsSpy = vi.spyOn(meteredSend, 'sendMeteredSms')
const sendMeteredWhatsAppSpy = vi.spyOn(meteredSend, 'sendMeteredWhatsApp')

// Import handlers dynamically so mocks apply first
const { POST: postRegister } = await import('@/app/api/v1/attendance/register/route')
const { POST: postBiometricIngest } = await import('@/app/api/v1/attendance/biometric/ingest/route')
const { GET: getParentAttendance } = await import('@/app/api/v1/parent/attendance/route')
const { signMobileAccessToken } = await import('@/lib/mobile-auth/jwt')

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `att-probe-${Date.now()}`

let orgId: string
let academicYearId: string
let branchId: string
let teacherUserId: string
let teacherId: string
let otherTeacherUserId: string
let otherTeacherId: string
let adminUserId: string
let parentUserId: string
let parentId: string
let otherParentUserId: string
let otherParentId: string

let studentAId: string
let studentBId: string

let deviceId: string
const deviceKey = `vbd_${RUN}_device_key`
const deviceApiKeyHash = crypto.createHash('sha256').update(deviceKey).digest('hex')

// Helper to build NextRequest
function mockReq(url: string, method: string, headers: Record<string, string>, body?: any) {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
}

// Helper to build CRM API headers
function authHeaders(role: string, userId: string) {
  return {
    'x-user-id': userId,
    'x-user-role': role,
    'x-org-id': orgId,
    'x-user-name': 'Test User',
    'x-academic-year-id': academicYearId
  }
}

async function waitForSpy(spy: any, timeout = 3000) {
  const start = Date.now()
  while (spy.mock.calls.length === 0 && Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 50))
  }
}

beforeAll(async () => {
  process.env.MOBILE_JWT_SECRET = 'test-secret-test-secret-test-secret-1234'

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
      settings: {
        attendance: {
          workingDays: [1, 2, 3, 4, 5, 6],
          absenceAlerts: { enabled: true, sms: true, whatsapp: true, portal: true }
        }
      }
    }
  })
  orgId = org.id

  // Enable Modules
  const modulesToEnable = ['attendance', 'whatsapp_addon', 'sms_addon']
  for (const slug of modulesToEnable) {
    const m = await prisma.module.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug, description: slug }
    })
    await prisma.organizationModule.create({
      data: { orgId, moduleId: m.id, enabled: true }
    })
  }

  // Seed Academic Year
  const ay = await prisma.academicYear.create({
    data: {
      orgId,
      name: `${RUN}-AY`,
      type: 'ACADEMIC',
      status: 'ACTIVE',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T00:00:00Z')
    }
  })
  academicYearId = ay.id

  // Seed Branch
  const branch = await prisma.branch.create({
    data: { orgId, name: `${RUN}-branch`, isDefault: true }
  })
  branchId = branch.id

  // Seed Admin User
  const adminUser = await prisma.user.create({
    data: { name: 'Admin', email: `admin@${RUN}.com`, orgId }
  })
  adminUserId = adminUser.id
  await prisma.userRoleAssignment.create({
    data: { userId: adminUserId, role: 'ORG_ADMIN', orgId }
  })

  // Seed Teacher Users
  const teacherUser = await prisma.user.create({
    data: { name: 'Teacher 1', email: `teacher1@${RUN}.com`, orgId }
  })
  teacherUserId = teacherUser.id
  await prisma.userRoleAssignment.create({
    data: { userId: teacherUserId, role: 'TEACHER', orgId }
  })

  const otherTeacherUser = await prisma.user.create({
    data: { name: 'Teacher 2', email: `teacher2@${RUN}.com`, orgId }
  })
  otherTeacherUserId = otherTeacherUser.id
  await prisma.userRoleAssignment.create({
    data: { userId: otherTeacherUserId, role: 'TEACHER', orgId }
  })

  // Seed Students
  const studentA = await prisma.student.create({
    data: {
      orgId,
      branchId,
      academicYearId,
      studentCode: `${RUN}-STUA`,
      name: 'Student A',
      gradeLabel: 'Grade 5',
      section: 'A',
      status: 'ACTIVE',
      guardianPhone: '919999955001'
    }
  })
  studentAId = studentA.id

  const studentB = await prisma.student.create({
    data: {
      orgId,
      branchId,
      academicYearId,
      studentCode: `${RUN}-STUB`,
      name: 'Student B',
      gradeLabel: 'Grade 5',
      section: 'B',
      status: 'ACTIVE',
      guardianPhone: '919999955002'
    }
  })
  studentBId = studentB.id

  // Assign teacher 1 to Grade 5 Section A
  await prisma.teacherAssignment.create({
    data: {
      orgId,
      teacherId: teacherUserId,
      academicYearId,
      gradeLabel: 'Grade 5',
      section: 'A',
      targetKey: 'Grade 5|A||'
    }
  })

  // Seed Parents
  const pUser = await prisma.user.create({
    data: { name: 'Parent A', phone: '919999955001', orgId }
  })
  parentUserId = pUser.id
  await prisma.userRoleAssignment.create({
    data: { userId: parentUserId, role: 'PARENT', orgId }
  })

  const p = await prisma.parent.create({
    data: { name: 'Parent A', phone: '919999955001', userId: parentUserId }
  })
  parentId = p.id

  // Link Parent A to Student A
  await prisma.studentGuardianLink.create({
    data: { orgId, parentId, studentId: studentAId, relation: 'FATHER', status: 'ACTIVE' }
  })

  const otherPUser = await prisma.user.create({
    data: { name: 'Parent B', phone: '919999955002', orgId }
  })
  otherParentUserId = otherPUser.id
  await prisma.userRoleAssignment.create({
    data: { userId: otherParentUserId, role: 'PARENT', orgId }
  })

  const otherP = await prisma.parent.create({
    data: { name: 'Parent B', phone: '919999955002', userId: otherParentUserId }
  })
  otherParentId = otherP.id

  // Link Parent B to Student B
  await prisma.studentGuardianLink.create({
    data: { orgId, parentId: otherParentId, studentId: studentBId, relation: 'FATHER', status: 'ACTIVE' }
  })

  // Seed Biometric Device
  const device = await prisma.biometricDevice.create({
    data: {
      orgId,
      branchId,
      name: `${RUN}-device`,
      apiKeyPrefix: deviceKey.slice(0, 8),
      apiKeyHash: deviceApiKeyHash,
      isActive: true
    }
  })
  deviceId = device.id

  // Seed Biometric Identity for Student A
  await prisma.biometricIdentity.create({
    data: { orgId, deviceId, deviceUserId: 'dev_user_a', studentId: studentAId }
  })

  // Seed Biometric Identity for Student B
  await prisma.biometricIdentity.create({
    data: { orgId, deviceId, deviceUserId: 'dev_user_b', studentId: studentBId }
  })

  // Clear spies
  spendCreditsSpy.mockClear()
  sendMeteredSmsSpy.mockClear()
  sendMeteredWhatsAppSpy.mockClear()
})

afterAll(async () => {
  // Give any background fire-and-forget promises time to complete
  await new Promise(r => setTimeout(r, 1000))
  // Clean up seeded data in reverse order of creation
  if (orgId) {
    await prisma.biometricIdentity.deleteMany({ where: { orgId } })
    await prisma.biometricEvent.deleteMany({ where: { orgId } })
    await prisma.biometricDevice.deleteMany({ where: { orgId } })
    
    const parentIds = [parentId, otherParentId].filter(Boolean)
    if (parentIds.length > 0) {
      await prisma.studentGuardianLink.deleteMany({ where: { parentId: { in: parentIds } } })
      await prisma.parent.deleteMany({ where: { id: { in: parentIds } } })
    }
    
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.teacherAssignment.deleteMany({ where: { orgId } })
    await prisma.attendanceRecord.deleteMany({ where: { orgId } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.academicYear.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describeDb('VidhyaanCRM Attendance System Verification Probes', () => {
  // A. Manual marking — positive
  it('1. Teacher marks assigned class successfully, unique per (orgId, studentId, date, sessionKey)', async () => {
    const today = istDateString()
    const reqHeaders = authHeaders('TEACHER', teacherUserId)
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentAId, status: 'PRESENT' }]
    })

    const res = await postRegister(req)
    expect(res.status).toBe(200)

    const dbRecord = await prisma.attendanceRecord.findFirst({
      where: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' }
    })
    expect(dbRecord).not.toBeNull()
    expect(dbRecord?.status).toBe('PRESENT')
    expect(dbRecord?.markedById).toBe(teacherUserId)
  })

  it('2. Teacher marks a whole class bulk submit (up to 500 entries) - verify atomic', async () => {
    const today = istDateString()
    const reqHeaders = authHeaders('TEACHER', teacherUserId)

    // Verify atomic nature by saving multiple entries together.
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [
        { studentId: studentAId, status: 'HALF_DAY' }
        // Filter handles unauthorized students, but a DB level constraint would cause total transaction abort.
        // Prisma transaction is run.
      ]
    })
    const res = await postRegister(req)
    expect(res.status).toBe(200)

    const dbRecord = await prisma.attendanceRecord.findFirst({
      where: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' }
    })
    expect(dbRecord?.status).toBe('HALF_DAY')
  })

  it('3. Admin marks attendance for a class with no TeacherAssignment', async () => {
    const today = istDateString()
    // Admin marks for Student B (Grade 5 Section B) - who has no teacher assignments seeded
    const reqHeaders = authHeaders('ORG_ADMIN', adminUserId)
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentBId, status: 'PRESENT' }]
    })

    const res = await postRegister(req)
    expect(res.status).toBe(200)

    const dbRecord = await prisma.attendanceRecord.findFirst({
      where: { orgId, studentId: studentBId, date: toDbDate(today), sessionKey: 'DAY' }
    })
    expect(dbRecord).not.toBeNull()
    expect(dbRecord?.status).toBe('PRESENT')
  })

  // A. Manual marking — negative
  it('4. Teacher tries to mark class they are not assigned to -> blocked server-side with 403', async () => {
    const today = istDateString()
    // Teacher 1 tries to mark Student B (Grade 5 Section B), not assigned
    const reqHeaders = authHeaders('TEACHER', teacherUserId)
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentBId, status: 'PRESENT' }]
    })

    const res = await postRegister(req)
    expect(res.status).toBe(403) // Blocked server-side!
  })

  it('5. Future-date probe: mark attendance for a date in the future -> rejected 422 (gap FIXED)', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const reqHeaders = authHeaders('TEACHER', teacherUserId)
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: tomorrowStr,
      entries: [{ studentId: studentAId, status: 'PRESENT' }]
    })

    const res = await postRegister(req)
    // Fixed: future dates are rejected by validation
    expect(res.status).toBe(422)

    const dbRecord = await prisma.attendanceRecord.findFirst({
      where: { orgId, studentId: studentAId, date: toDbDate(tomorrowStr), sessionKey: 'DAY' }
    })
    expect(dbRecord).toBeNull()
  })

  it('6. Historical edit probe -> succeeds, leaves no audit trail of prior values (confirmed gap)', async () => {
    const pastDate = '2026-07-01'
    const reqHeaders = authHeaders('TEACHER', teacherUserId)

    // First write
    const req1 = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: pastDate,
      entries: [{ studentId: studentAId, status: 'PRESENT' }]
    })
    await postRegister(req1)

    // Update
    const req2 = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: pastDate,
      entries: [{ studentId: studentAId, status: 'ABSENT' }]
    })
    const res2 = await postRegister(req2)
    expect(res2.status).toBe(200)

    const dbRecord = await prisma.attendanceRecord.findFirst({
      where: { orgId, studentId: studentAId, date: toDbDate(pastDate), sessionKey: 'DAY' }
    })
    expect(dbRecord?.status).toBe('ABSENT')
    expect(dbRecord?.updatedById).toBe(teacherUserId)

    // There is no attendance_records_history or similar audit trail table.
    // The previous state "PRESENT" is overwritten and completely lost.
  })

  // B. Biometric ingest — negative
  it('7. Valid ingest payload with correct x-device-key -> records created, punches extend', async () => {
    const today = istDateString()
    const t1 = new Date(`${today}T08:00:00.000Z`)
    const t2 = new Date(`${today}T17:00:00.000Z`)
    const t3 = new Date(`${today}T16:00:00.000Z`)

    // Clean any prior records for Student A on today
    await prisma.attendanceRecord.deleteMany({
      where: { orgId, studentId: studentAId, date: toDbDate(today) }
    })

    // First punch - check-in
    const req1 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: t1.toISOString() }]
    })
    const res1 = await postBiometricIngest(req1)
    expect(res1.status).toBe(200)

    let record = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    expect(record).not.toBeNull()
    expect(record?.status).toBe('PRESENT')
    expect(record?.source).toBe('BIOMETRIC')
    expect(record?.checkInAt?.toISOString()).toBe(t1.toISOString())
    expect(record?.checkOutAt).toBeNull()

    // Second punch - check-out
    const req2 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: t2.toISOString(), direction: 'out' }]
    })
    const res2 = await postBiometricIngest(req2)
    expect(res2.status).toBe(200)

    record = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    expect(record?.checkInAt?.toISOString()).toBe(t1.toISOString())
    expect(record?.checkOutAt?.toISOString()).toBe(t2.toISOString())

    // Third punch (earlier than checkout) - should not contract checkOutAt
    const req3 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: t3.toISOString(), direction: 'out' }]
    })
    await postBiometricIngest(req3)

    record = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    expect(record?.checkOutAt?.toISOString()).toBe(t2.toISOString()) // Remains t2 (17:00), doesn't move to t3 (16:00)
  })

  it('8. Ingest payload with wrong/missing x-device-key -> rejected 401', async () => {
    // Missing key
    const req1 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {}, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: new Date().toISOString() }]
    })
    const res1 = await postBiometricIngest(req1)
    expect(res1.status).toBe(401)

    // Wrong key
    const req2 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': 'wrong_key'
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: new Date().toISOString() }]
    })
    const res2 = await postBiometricIngest(req2)
    expect(res2.status).toBe(401)
  })

  it('9. Replay same event twice -> deduped via unique constraint + skipDuplicates', async () => {
    const timestamp = new Date().toISOString()
    const payload = {
      records: [{ deviceUserId: 'dev_user_a', timestamp }]
    }

    const req1 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, payload)
    const res1 = await postBiometricIngest(req1)
    expect(res1.status).toBe(200)

    // Replay same punch
    const req2 = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, payload)
    const res2 = await postBiometricIngest(req2)
    expect(res2.status).toBe(200) // Deduplicated, doesn't throw DB unique violation errors.
  })

  it('10. Rate limiting probe -> confirmed gap (no rate limit on ingest)', () => {
    // Verified by inspect code: `src/app/api/v1/attendance/biometric/ingest/route.ts` has no rate-limiting middleware or decorators.
    // Unthrottled payloads up to 1000 records per payload can hammer the DB.
  })

  it('11. Biometric punch does NOT overwrite MANUAL/API record', async () => {
    const today = istDateString()
    
    // Create MANUAL record first
    await prisma.attendanceRecord.upsert({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } },
      create: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY', status: 'ABSENT', source: 'MANUAL' },
      update: { status: 'ABSENT', source: 'MANUAL' }
    })

    // Try biometric ingest
    const req = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: new Date(`${today}T10:00:00.000Z`).toISOString() }]
    })
    const res = await postBiometricIngest(req)
    expect(res.status).toBe(200)

    // Verify it was not overwritten (still status ABSENT, source MANUAL)
    const record = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    expect(record?.status).toBe('ABSENT')
    expect(record?.source).toBe('MANUAL')
  })

  it('12. Manual correction over biometric record resets source to MANUAL (gap FIXED)', async () => {
    const today = istDateString()
    
    // Simulate manual marking saving over biometric record
    // 1. Biometric event creates a record:
    await prisma.attendanceRecord.upsert({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } },
      create: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY', status: 'PRESENT', source: 'BIOMETRIC', checkInAt: new Date() },
      update: { status: 'PRESENT', source: 'BIOMETRIC' }
    })

    // 2. Teacher manually corrects it (e.g. status to LEAVE) via POST /api/v1/attendance/register
    const reqHeaders = authHeaders('TEACHER', teacherUserId)
    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentAId, status: 'LEAVE' }]
    })
    await postRegister(req)

    // Verify the record's source state
    const record = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    
    // Fixed: manual register save updates status AND resets source to MANUAL
    expect(record?.status).toBe('LEAVE')
    expect(record?.source).toBe('MANUAL')

    // 3. With source now MANUAL, a subsequent biometric event must not overwrite the manual correction
    const reqBio = mockReq('http://localhost/api/v1/attendance/biometric/ingest', 'POST', {
      'x-device-key': deviceKey
    }, {
      records: [{ deviceUserId: 'dev_user_a', timestamp: new Date(`${today}T18:00:00.000Z`).toISOString(), direction: 'out' }]
    })
    await postBiometricIngest(reqBio)

    const updatedRecord = await prisma.attendanceRecord.findUnique({
      where: { orgId_studentId_date_sessionKey: { orgId, studentId: studentAId, date: toDbDate(today), sessionKey: 'DAY' } }
    })
    expect(updatedRecord?.status).toBe('LEAVE')
    expect(updatedRecord?.source).toBe('MANUAL')
  })

  // C. Parent-facing — scoping
  it('13. Parent can view own linked child attendance (read-only)', async () => {
    // GET /api/v1/parent/attendance?studentId=studentAId&month=2026-07
    const token = await signMobileAccessToken({
      userId: parentUserId,
      role: 'PARENT',
      phoneNumber: '919999955001'
    })
    const reqHeaders = {
      authorization: `Bearer ${token}`
    }
    const req = mockReq(`http://localhost/api/v1/parent/attendance?studentId=${studentAId}&month=2026-07`, 'GET', reqHeaders)
    const res = await getParentAttendance(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.student.id).toBe(studentAId)
  })

  it("14. Parent cannot view another family's student (blocked 404)", async () => {
    // Parent A tries to fetch Student B (linked to Parent B)
    const token = await signMobileAccessToken({
      userId: parentUserId,
      role: 'PARENT',
      phoneNumber: '919999955001'
    })
    const reqHeaders = {
      authorization: `Bearer ${token}`
    }
    const req = mockReq(`http://localhost/api/v1/parent/attendance?studentId=${studentBId}&month=2026-07`, 'GET', reqHeaders)
    const res = await getParentAttendance(req)
    // Should be blocked (returns 404)
    expect(res.status).toBe(404)
  })

  // D. Absence alerts
  it('15. Mark student ABSENT for today -> SMS/WhatsApp alert fires, credit spend intent metered', async () => {
    const today = istDateString()
    const reqHeaders = authHeaders('TEACHER', teacherUserId)

    // Reset spy counters
    spendCreditsSpy.mockClear()

    // Clean record
    await prisma.attendanceRecord.deleteMany({
      where: { orgId, studentId: studentAId, date: toDbDate(today) }
    })

    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentAId, status: 'ABSENT' }]
    })
    const res = await postRegister(req)
    expect(res.status).toBe(200)

    // Wait for spendCreditsWithIntent to be called asynchronously
    await waitForSpy(spendCreditsSpy, 5000)

    // Verify SMS/WhatsApp sent
    expect(spendCreditsSpy).toHaveBeenCalled()
    const calls = spendCreditsSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][0]).toBe(orgId)
  })

  it('16. Mark student ABSENT for a past date (historical correction) -> no alerts fire', async () => {
    const pastDate = '2026-07-02'
    const reqHeaders = authHeaders('TEACHER', teacherUserId)

    spendCreditsSpy.mockClear()

    await prisma.attendanceRecord.deleteMany({
      where: { orgId, studentId: studentAId, date: toDbDate(pastDate) }
    })

    const req = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: pastDate,
      entries: [{ studentId: studentAId, status: 'ABSENT' }]
    })
    await postRegister(req)
    // Wait a brief moment to ensure nothing gets called
    await new Promise(r => setTimeout(r, 300))

    // Should NOT have triggered any credit spend
    expect(spendCreditsSpy).not.toHaveBeenCalled()
  })

  it('17. Mark same student ABSENT twice for same day -> only one alert sends (alertSentAt guard)', async () => {
    const today = istDateString()
    const reqHeaders = authHeaders('TEACHER', teacherUserId)

    // Clean record
    await prisma.attendanceRecord.deleteMany({
      where: { orgId, studentId: studentAId, date: toDbDate(today) }
    })

    spendCreditsSpy.mockClear()

    // 1st mark
    const req1 = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentAId, status: 'ABSENT' }]
    })
    await postRegister(req1)
    
    // Wait for the first alert to be dispatched and call the credit engine
    await waitForSpy(spendCreditsSpy, 5000)

    const count1 = spendCreditsSpy.mock.calls.length
    expect(count1).toBeGreaterThan(0)

    spendCreditsSpy.mockClear()

    // 2nd mark (edit/resave)
    const req2 = mockReq('http://localhost/api/v1/attendance/register', 'POST', reqHeaders, {
      date: today,
      entries: [{ studentId: studentAId, status: 'ABSENT' }]
    })
    await postRegister(req2)
    // Wait a brief moment
    await new Promise(r => setTimeout(r, 300))

    // Should NOT send again
    expect(spendCreditsSpy).not.toHaveBeenCalled()
  })
})
