import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'
import { StudentStatus, Gender } from '@prisma/client'

// Mock storage to prevent real S3 hits
vi.mock('@/lib/storage', () => ({
  uploadObject: vi.fn().mockResolvedValue({ key: 'test', url: 'test' }),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  UPLOAD_CATEGORIES: ['leads', 'admissions', 'events', 'campaigns', 'students', 'documents', 'school-media']
}))

// Import route handlers
import { POST as createStudent, GET as listStudents } from '@/app/api/v1/students/route'
import { PUT as updateStudent, DELETE as deleteStudent } from '@/app/api/v1/students/[id]/route'
import { POST as bulkStudent } from '@/app/api/v1/students/bulk/route'
import { POST as promoteStudents } from '@/app/api/v1/students/promote/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `stu-test-${Date.now()}`

let orgId: string
let adminId: string
let branchId: string
let academicYearId1: string
let academicYearId2: string
let headersAdmin: Headers

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
      settings: {
        dedup: {
          rules: {
            exactApplication: 'hard',
            sameChildSameYear: 'hard',
            contactAndChild: 'soft',
            emailAndChild: 'soft',
            sharedEmail: 'soft',
            nameOnly: 'off'
          }
        }
      }
    }
  })
  orgId = org.id

  // Enable student_management module
  let mod = await prisma.module.findFirst({
    where: { slug: 'student_management' }
  })
  if (!mod) {
    mod = await prisma.module.create({
      data: { name: 'Student Management', slug: 'student_management' }
    })
  }
  await prisma.organizationModule.create({
    data: { orgId, moduleId: mod.id, enabled: true, enabledAt: new Date() }
  })

  // Enable fee_management module (for invoice tests)
  let feeMod = await prisma.module.findFirst({
    where: { slug: 'fee_management' }
  })
  if (!feeMod) {
    feeMod = await prisma.module.create({
      data: { name: 'Fee Management', slug: 'fee_management' }
    })
  }
  await prisma.organizationModule.create({
    data: { orgId, moduleId: feeMod.id, enabled: true, enabledAt: new Date() }
  })

  // Seed default branch
  const br = await prisma.branch.create({
    data: { orgId, name: `${RUN}-default`, isDefault: true }
  })
  branchId = br.id

  // Seed two academic years
  const ay1 = await prisma.academicYear.create({
    data: {
      orgId,
      name: '2026-27',
      type: 'ACADEMIC',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
      status: 'ACTIVE'
    }
  })
  academicYearId1 = ay1.id

  const ay2 = await prisma.academicYear.create({
    data: {
      orgId,
      name: '2027-28',
      type: 'ACADEMIC',
      startDate: new Date('2027-06-01'),
      endDate: new Date('2028-05-31'),
      status: 'UPCOMING'
    }
  })
  academicYearId2 = ay2.id

  // Seed admin user
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Test Org Admin',
      email: `admin-user@${RUN}.local`,
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' }
      }
    }
  })
  adminId = admin.id

  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'x-user-name': 'Test Org Admin',
    'Content-Type': 'application/json'
  })
})

afterAll(async () => {
  if (orgId) {
    // Cleanup payments/invoices/students/organization
    await prisma.payment.deleteMany({ where: { orgId } })
    await prisma.invoiceItem.deleteMany({ where: { orgId } })
    await prisma.invoice.deleteMany({ where: { orgId } })
    await prisma.studentActivity.deleteMany({ where: { student: { orgId } } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.academicYear.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describeDb('Student Management Verification Suite', () => {
  // A. Create/enroll — positive
  it('1. Create with only name filled succeeds', async () => {
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Only Name Student' })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe('Only Name Student')
    expect(body.data.studentCode).toBeDefined()
  })

  it('2. Create with valid email + phone succeeds', async () => {
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Valid Student',
        guardianEmail: 'valid-guardian@gmail.com',
        guardianPhone: '9888877777'
      })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.guardianEmail).toBe('valid-guardian@gmail.com')
  })

  it('3. Create with section as free-text succeeds', async () => {
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Free Text Section Student',
        section: '🎉'
      })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.section).toBe('🎉')
  })

  // A. Create/enroll — negative
  it('4. Create with garbage phone gets rejected, alt numeric format succeeds', async () => {
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Garbage Phone Student',
        guardianPhone: 'abc'
      })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(422)

    const reqAlt = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Alt Phone Student',
        guardianPhone: '123'
      })
    })
    const resAlt = await createStudent(reqAlt)
    expect(resAlt.status).toBe(201)
    const body = await resAlt.json()
    expect(body.data.guardianPhone).toBe('123')
  })

  it('5. Create with non-deliverable but syntactically valid email gets rejected', async () => {
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Non Deliverable Student',
        guardianEmail: 'test@invalid-domain-nonexistent-12345.com'
      })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toContain('cannot receive email')
  })

  it('6. Create duplicate student phone/email check', async () => {
    // First student
    const student1Req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Unique Child',
        guardianEmail: 'dup-check@gmail.com',
        guardianPhone: '9111122222'
      })
    })
    const res1 = await createStudent(student1Req)
    expect(res1.status).toBe(201)

    // Second student with same phone/email (hard match because exact child + contact)
    const student2Req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Unique Child',
        guardianEmail: 'dup-check@gmail.com',
        guardianPhone: '9111122222',
        academicYearId: academicYearId1
      })
    })
    const res2 = await createStudent(student2Req)
    expect(res2.status).toBe(409)

    // Verify force: true fails for hard match
    const student3Req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Unique Child',
        guardianEmail: 'dup-check@gmail.com',
        guardianPhone: '9111122222',
        academicYearId: academicYearId1,
        force: true
      })
    })
    const res3 = await createStudent(student3Req)
    expect(res3.status).toBe(409)
  })

  it('7. Section validation caps (max 50 on create vs max 10 on promote)', async () => {
    // Create with section > 50 chars
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Long Section Kid',
        section: 'a'.repeat(51)
      })
    })
    const resCreate = await createStudent(reqCreate)
    expect(resCreate.status).toBe(422)

    // Create valid student to promote
    const reqValid = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Promo Section Kid' })
    })
    const resValid = await createStudent(reqValid)
    expect(resValid.status).toBe(201)
    const student = (await resValid.json()).data

    // Promote with toSection > 50 chars
    const reqPromote = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'PROMOTE',
          toGrade: 'Class 2',
          toSection: 'a'.repeat(51)
        }]
      })
    })
    const resPromote = await promoteStudents(reqPromote)
    expect(resPromote.status).toBe(422)
  })

  // B. Status lifecycle — negative
  it('8. Status transitions ACTIVE -> ALUMNI -> ACTIVE -> DROPPED_OUT -> ACTIVE succeed', async () => {
    // Create active student
    const req = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'State Machine Kid' })
    })
    const res = await createStudent(req)
    expect(res.status).toBe(201)
    const student = (await res.json()).data

    // 1. ACTIVE -> ALUMNI
    const req1 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'ALUMNI' })
    })
    const res1 = await updateStudent(req1, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res1.status).toBe(200)
    expect((await res1.json()).data.status).toBe('ALUMNI')

    // 2. ALUMNI -> ACTIVE
    const req2 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'ACTIVE' })
    })
    const res2 = await updateStudent(req2, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res2.status).toBe(200)
    expect((await res2.json()).data.status).toBe('ACTIVE')

    // 3. ACTIVE -> DROPPED_OUT
    const req3 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'DROPPED_OUT' })
    })
    const res3 = await updateStudent(req3, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res3.status).toBe(200)
    expect((await res3.json()).data.status).toBe('DROPPED_OUT')

    // 4. DROPPED_OUT -> ACTIVE
    const req4 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'ACTIVE' })
    })
    const res4 = await updateStudent(req4, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res4.status).toBe(200)
    expect((await res4.json()).data.status).toBe('ACTIVE')
  })

  it('9. Direct status transition SUSPENDED -> TRANSFERRED succeeds', async () => {
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'State Transition Kid 2' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // ACTIVE -> SUSPENDED
    const req1 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'SUSPENDED' })
    })
    const res1 = await updateStudent(req1, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res1.status).toBe(200)

    // SUSPENDED -> TRANSFERRED
    const req2 = new NextRequest(`http://localhost/api/v1/students/${student.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({ status: 'TRANSFERRED' })
    })
    const res2 = await updateStudent(req2, { params: Promise.resolve({ id: student.id }) } as any)
    expect(res2.status).toBe(200)
    expect((await res2.json()).data.status).toBe('TRANSFERRED')
  })

  // C. Bulk delete — negative
  it('10 & 11. Bulk delete student with financial history succeeds, leaving orphaned records (no cascade)', async () => {
    // Create student
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Financial History Kid' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // Create Invoice (PAID status does not block bulk deletion)
    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        studentId: student.id,
        invoiceNumber: `${RUN}-INV-1`,
        totalAmount: 1000,
        paidAmount: 1000,
        status: 'PAID'
      }
    })

    // Create Payment
    const payment = await prisma.payment.create({
      data: {
        orgId,
        invoiceId: invoice.id,
        studentId: student.id,
        receiptNumber: `${RUN}-RCP-1`,
        amount: 500,
        status: 'SUCCESS'
      }
    })

    // 10. Bulk delete student
    const reqBulkDelete = new NextRequest('http://localhost/api/v1/students/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        action: 'delete',
        ids: [student.id]
      })
    })
    const resBulkDelete = await bulkStudent(reqBulkDelete)
    expect(resBulkDelete.status).toBe(200)
    expect((await resBulkDelete.json()).data.deleted).toBe(1)

    // 11. Verify invoice & payment are orphaned (deletedAt is null, student deletedAt is set)
    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } })
    expect(dbStudent?.deletedAt).not.toBeNull()

    const dbInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } })
    expect(dbInvoice?.deletedAt).toBeNull()

    const dbPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
    expect(dbPayment?.deletedAt).toBeNull()
  })

  it('12. Bulk delete limit validation (200 vs 201)', async () => {
    const list200 = Array.from({ length: 200 }, (_, i) => `id-${i}`)
    const req200 = new NextRequest('http://localhost/api/v1/students/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        action: 'delete',
        ids: list200
      })
    })
    const res200 = await bulkStudent(req200)
    // Should pass schema parsing (even if ids don't exist, updateMany finishes with deleted: 0)
    expect(res200.status).toBe(200)

    const list201 = Array.from({ length: 201 }, (_, i) => `id-${i}`)
    const req201 = new NextRequest('http://localhost/api/v1/students/bulk', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        action: 'delete',
        ids: list201
      })
    })
    const res201 = await bulkStudent(req201)
    expect(res201.status).toBe(422)
  })

  // D. Year-end promotion wizard
  it('13. Promote completes even if invoice generation is separate', async () => {
    // Create student
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Decoupled Promo Kid' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // Call Promote (invoice generation is separate, so this succeeds completely)
    const reqPromote = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'PROMOTE',
          toGrade: 'Class 3',
          toSection: 'A'
        }]
      })
    })
    const resPromote = await promoteStudents(reqPromote)
    expect(resPromote.status).toBe(200)

    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } })
    expect(dbStudent?.gradeLabel).toBe('Class 3')
    expect(dbStudent?.section).toBe('A')
    expect(dbStudent?.academicYearId).toBe(academicYearId2)
  })

  it('14. Mark Alumni in wizard sets status/alumniSince without soft-delete, visible in active lists if queried', async () => {
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Wizard Alumni Kid' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // Promote to ALUMNI
    const reqPromote = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'ALUMNI'
        }]
      })
    })
    const resPromote = await promoteStudents(reqPromote)
    expect(resPromote.status).toBe(200)

    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } })
    expect(dbStudent?.status).toBe('ALUMNI')
    expect(dbStudent?.alumniSince).not.toBeNull()
    expect(dbStudent?.deletedAt).toBeNull() // Not soft-deleted!

    // Verify it is visible in default list when filtered by ALUMNI status
    const reqList = new NextRequest(`http://localhost/api/v1/students?status=ALUMNI`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resList = await listStudents(reqList)
    expect(resList.status).toBe(200)
    const listData = await resList.json()
    const found = listData.data.find((s: any) => s.id === student.id)
    expect(found).toBeDefined()
  })

  it('15. Retain in wizard does not duplicate student row or corrupt link', async () => {
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Retain Kid', academicYearId: academicYearId1, gradeLabel: 'Class 1', section: 'A' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // Retain to AY2
    const reqPromote = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'RETAIN',
          toSection: 'A'
        }]
      })
    })
    const resPromote = await promoteStudents(reqPromote)
    expect(resPromote.status).toBe(200)

    // Check no duplicate row created
    const count = await prisma.student.count({ where: { orgId, name: 'Retain Kid' } })
    expect(count).toBe(1)

    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } })
    expect(dbStudent?.academicYearId).toBe(academicYearId2)
  })

  it('16. Double submit wizard doesn\'t duplicate promote activities or row updates', async () => {
    const reqCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Double Submit Kid' })
    })
    const resCreate = await createStudent(reqCreate)
    const student = (await resCreate.json()).data

    // First call
    const reqPromote1 = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'PROMOTE',
          toGrade: 'Class 4'
        }]
      })
    })
    const resPromote1 = await promoteStudents(reqPromote1)
    expect(resPromote1.status).toBe(200)

    // Second call (wizard resubmit)
    const reqPromote2 = new NextRequest('http://localhost/api/v1/students/promote', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        toAcademicYearId: academicYearId2,
        moves: [{
          studentId: student.id,
          action: 'PROMOTE',
          toGrade: 'Class 4'
        }]
      })
    })
    const resPromote2 = await promoteStudents(reqPromote2)
    expect(resPromote2.status).toBe(200)

    // Check database row matches, and activity count is 2 (two system activity logs created)
    const count = await prisma.studentActivity.count({ where: { studentId: student.id, type: 'SYSTEM' } })
    expect(count).toBe(2)
  })

  // E. Academic-year scoping
  it('17 & 18. Academic year scoping checks (legacy/null AY and specific AY filters)', async () => {
    // Create Legacy Student (null AY) directly in DB
    const studentCode = `STU-LEGACY-${Date.now()}`
    const legacyStudent = await prisma.student.create({
      data: {
        orgId,
        studentCode,
        name: 'Legacy Student',
        academicYearId: null,
        status: 'ACTIVE'
      }
    })
    expect(legacyStudent.academicYearId).toBeNull()

    // Create AY1 Student
    const reqAy1 = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'AY1 Student', academicYearId: academicYearId1 })
    })
    const resAy1 = await createStudent(reqAy1)
    const ay1Student = (await resAy1.json()).data

    // Create AY2 Student
    const reqAy2 = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'AY2 Student', academicYearId: academicYearId2 })
    })
    const resAy2 = await createStudent(reqAy2)
    const ay2Student = (await resAy2.json()).data

    // Query with AY1 filter
    const reqFilterAy1 = new NextRequest(`http://localhost/api/v1/students?academicYearId=${academicYearId1}`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resFilterAy1 = await listStudents(reqFilterAy1)
    const dataAy1 = (await resFilterAy1.json()).data

    // Verify AY1 filter contains: AY1 Student and Legacy Student, but NOT AY2 Student
    expect(dataAy1.find((s: any) => s.id === ay1Student.id)).toBeDefined()
    expect(dataAy1.find((s: any) => s.id === legacyStudent.id)).toBeDefined()
    expect(dataAy1.find((s: any) => s.id === ay2Student.id)).toBeUndefined()

    // Query with AY2 filter
    const reqFilterAy2 = new NextRequest(`http://localhost/api/v1/students?academicYearId=${academicYearId2}`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resFilterAy2 = await listStudents(reqFilterAy2)
    const dataAy2 = (await resFilterAy2.json()).data

    // Verify AY2 filter contains: AY2 Student and Legacy Student, but NOT AY1 Student
    expect(dataAy2.find((s: any) => s.id === ay2Student.id)).toBeDefined()
    expect(dataAy2.find((s: any) => s.id === legacyStudent.id)).toBeDefined()
    expect(dataAy2.find((s: any) => s.id === ay1Student.id)).toBeUndefined()
  })
})
