import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'

// Mock storage calls to avoid real S3 hits
vi.mock('@/lib/storage', () => ({
  uploadObject: vi.fn().mockImplementation(async (opts) => {
    return {
      key: `uploads/${opts.orgId}/${opts.category || 'documents'}/test-file.pdf`,
      url: `https://test-bucket.s3.amazonaws.com/uploads/${opts.orgId}/${opts.category || 'documents'}/test-file.pdf`
    }
  }),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  UPLOAD_CATEGORIES: ['leads', 'admissions', 'events', 'campaigns', 'students', 'documents', 'school-media']
}))

import { POST as createAdmission, GET as listAdmissions } from '@/app/api/v1/admissions/route'
import { PUT as updateAdmission, GET as getAdmission, DELETE as deleteAdmission } from '@/app/api/v1/admissions/[id]/route'
import { POST as convertAdmission } from '@/app/api/v1/admissions/[id]/convert/route'
import { POST as archiveAdmission } from '@/app/api/v1/admissions/[id]/archive/route'
import { POST as registerDocument, GET as listDocuments } from '@/app/api/v1/admissions/[id]/documents/route'
import { DELETE as deleteDocument } from '@/app/api/v1/admissions/[id]/documents/[docId]/route'
import { PUT as updateDocumentStatus } from '@/app/api/v1/admissions/[id]/documents/[docId]/status/route'
import { POST as uploadFile } from '@/app/api/v1/files/upload/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)

const RUN = `adm-test-${Date.now()}`

let orgId: string
let adminId: string
let counsellorId: string
let branchId: string
let academicYearId: string
let stageNewId: string
let stageAdmittedId: string
let stageRejectedId: string
let stageDocsRequiredId: string

let headersAdmin: Headers
let headersCounsellor: Headers

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

  // Seed admission_management module enablement
  let mod = await prisma.module.findFirst({
    where: { slug: 'admission_management' }
  })
  if (!mod) {
    mod = await prisma.module.create({
      data: {
        name: 'Admission Management',
        slug: 'admission_management'
      }
    })
  }
  await prisma.organizationModule.create({
    data: {
      orgId,
      moduleId: mod.id,
      enabled: true,
      enabledAt: new Date()
    }
  })

  // Seed branch
  const br = await prisma.branch.create({
    data: { orgId, name: `${RUN}-default`, isDefault: true }
  })
  branchId = br.id

  // Seed academic year
  const ay = await prisma.academicYear.create({
    data: {
      orgId,
      name: '2026-27',
      type: 'ACADEMIC',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
      status: 'ACTIVE'
    }
  })
  academicYearId = ay.id

  // Seed admission stages
  const sNew = await prisma.admissionStage.create({
    data: { orgId, name: 'New', sortOrder: 1, isWon: false, isLost: false }
  })
  stageNewId = sNew.id

  const sDocs = await prisma.admissionStage.create({
    data: { orgId, name: 'Docs Uploaded', sortOrder: 2, isWon: false, isLost: false, requiresDocs: true }
  })
  stageDocsRequiredId = sDocs.id

  const sAdmitted = await prisma.admissionStage.create({
    data: { orgId, name: 'Admitted', sortOrder: 3, isWon: true, isLost: false }
  })
  stageAdmittedId = sAdmitted.id

  const sRejected = await prisma.admissionStage.create({
    data: { orgId, name: 'Rejected', sortOrder: 4, isWon: false, isLost: true }
  })
  stageRejectedId = sRejected.id

  // Seed users (Admin and Counsellor)
  const adminPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`
  const counsellorPhone = `8${Math.floor(100000000 + Math.random() * 900000000)}`

  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Test Org Admin',
      email: `admin-user@${RUN}.local`,
      phone: adminPhone,
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' }
      }
    }
  })
  adminId = admin.id

  const counsellor = await prisma.user.create({
    data: {
      orgId,
      name: 'Test Counsellor',
      email: `counsellor-user@${RUN}.local`,
      phone: counsellorPhone,
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'COUNSELLOR', orgId, status: 'ACTIVE' }
      }
    }
  })
  counsellorId = counsellor.id

  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'x-user-name': 'Test Org Admin',
    'Content-Type': 'application/json'
  })

  headersCounsellor = new Headers({
    'x-user-id': counsellorId,
    'x-user-role': 'COUNSELLOR',
    'x-org-id': orgId,
    'x-user-name': 'Test Counsellor',
    'Content-Type': 'application/json'
  })
})

afterAll(async () => {
  if (orgId) {
    // Clean up all records created under the test orgId
    await prisma.studentActivity.deleteMany({ where: { student: { orgId } } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.admissionDocument.deleteMany({ where: { orgId } })
    await prisma.admissionActivity.deleteMany({ where: { orgId } })
    await prisma.admission.deleteMany({ where: { orgId } })
    await prisma.leadActivity.deleteMany({ where: { orgId } })
    await prisma.lead.deleteMany({ where: { orgId } })
    await prisma.userBranchAccess.deleteMany({ where: { branch: { orgId } } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.admissionStage.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.academicYear.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describeDb('Admission Pipeline Integration Tests', () => {
  // A. Create admission — positive
  it('A1: Create admission with only applicantName filled', async () => {
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Only Name'
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.success).toBe(true)
    expect(resBody.data.applicantName).toBe('Only Name')
    expect(resBody.data.phone).toBeNull()
    expect(resBody.data.email).toBeNull()
  })

  it('A2: Create with valid email + valid phone (new)', async () => {
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Valid Contact Name',
        phone: '+919999900010',
        email: 'test@gmail.com'
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.data.phone).toBe('9999900010')
    expect(resBody.data.email).toBe('test@gmail.com')
  })

  it('A3: Create admission by converting an existing Lead (skips dedup block)', async () => {
    // 1. Create a lead with phone already in database (duplicate phone)
    const lead = await prisma.lead.create({
      data: {
        orgId,
        parentName: 'Lead Parent',
        phone: '+919999900010', // duplicate of A2
        leadCode: `${RUN}-LD1`,
        kidName: 'Lead Kid'
      }
    })

    // 2. Call POST with leadId. It should succeed because it skips dedup block.
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Lead Kid',
        phone: '+919999900010',
        leadId: lead.id
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.data.applicantName).toBe('Lead Kid')
    expect(resBody.data.leadId).toBe(lead.id)
  })

  // A. Create admission — negative
  it('A4: Create with a syntactically-valid but non-deliverable email', async () => {
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Non Deliverable Email Name',
        email: 'test@nonexistent-domain-xyz123.com'
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(422) // Business rule validation error is 422
    const data = await res.json()
    expect(data.error).toContain('cannot receive email')
  })

  it('A5: Create with a phone number in garbage format (should succeed)', async () => {
    // abc
    const req1 = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Garbage Phone 1',
        phone: 'abc'
      })
    })
    const res1 = await createAdmission(req1)
    expect(res1.status).toBe(422)

    // "1"
    const req2 = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Garbage Phone 2',
        phone: '1'
      })
    })
    const res2 = await createAdmission(req2)
    expect(res2.status).toBe(201)
  })

  it('A6: Create admission with same phone as existing record -> verify 409', async () => {
    // Try to create direct admission (no leadId) with same phone + child name + grade + year as A2
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Valid Contact Name',
        phone: '+919999900010', // duplicate
        email: 'test@gmail.com'
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(409) // Conflict
    const data = await res.json()
    expect(data.error).toContain('record already exists')
  })

  it('A7: Create with duplicate phone but force: true (still blocked for hard matches)', async () => {
    const req = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Valid Contact Name',
        phone: '+919999900010', // exact duplicate (hard match)
        email: 'test@gmail.com',
        force: true
      })
    })

    const res = await createAdmission(req)
    expect(res.status).toBe(409) // Still blocked
  })

  it('A8: Create a second admission from the same lead -> verify blocked', async () => {
    // 1. Create a lead
    const lead = await prisma.lead.create({
      data: {
        orgId,
        parentName: 'Reused Lead Parent',
        phone: '+919999900020',
        leadCode: `${RUN}-LD2`,
        kidName: 'Reused Lead Kid'
      }
    })

    // 2. Create first admission from it
    const req1 = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Reused Lead Kid',
        leadId: lead.id
      })
    })
    const res1 = await createAdmission(req1)
    expect(res1.status).toBe(201)

    // 3. Create second admission from it -> should be blocked by "one lead -> one admission"
    const req2 = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'Reused Lead Kid',
        leadId: lead.id
      })
    })
    const res2 = await createAdmission(req2)
    expect(res2.status).toBe(409)
    const data2 = await res2.json()
    expect(data2.error).toContain('already converted')
  })

  it('A9: Submit name at 151 chars, phone at 31 chars, notes at 5001 chars on update -> 422', async () => {
    // 1. Create a base admission
    const baseAdmission = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Base update',
        admissionCode: `${RUN}-AD-UPD-1`
      }
    })

    // 2. Try updating with 151 char applicantName
    const reqName = new NextRequest(`http://localhost/api/v1/admissions/${baseAdmission.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        applicantName: 'a'.repeat(151)
      })
    })
    const resName = await updateAdmission(reqName, { params: { id: baseAdmission.id } })
    expect(resName.status).toBe(422)

    // 3. Try updating with 31 char phone
    const reqPhone = new NextRequest(`http://localhost/api/v1/admissions/${baseAdmission.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        phone: '1'.repeat(31)
      })
    })
    const resPhone = await updateAdmission(reqPhone, { params: { id: baseAdmission.id } })
    expect(resPhone.status).toBe(422)

    // 4. Try updating with 5001 char notes
    const reqNotes = new NextRequest(`http://localhost/api/v1/admissions/${baseAdmission.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        notes: 'n'.repeat(5001)
      })
    })
    const resNotes = await updateAdmission(reqNotes, { params: { id: baseAdmission.id } })
    expect(resNotes.status).toBe(422)
  })

  it('A10: Submit invalid status enum value "FOO" on update -> 422', async () => {
    const baseAdmission = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Base update 2',
        admissionCode: `${RUN}-AD-UPD-2`
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${baseAdmission.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        status: 'FOO'
      })
    })
    const res = await updateAdmission(req, { params: { id: baseAdmission.id } })
    expect(res.status).toBe(422)
  })

  // B. Stage transitions — negative
  it('B11: Move admission from "New" directly to "Admitted" (skipping stages) -> succeeds (GAP)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Skip Stages',
        admissionCode: `${RUN}-AD-B11`,
        stageId: stageNewId
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        stageId: stageAdmittedId
      })
    })
    const res = await updateAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(200)

    const updated = await prisma.admission.findUnique({
      where: { id: adm.id },
      include: { stage: true }
    })
    expect(updated?.stageId).toBe(stageAdmittedId)
    // Status is also auto-updated to ADMITTED since stageAdmittedId is isWon = true
    expect(updated?.status).toBe('ADMITTED')
  })

  it('B12: Move already-Admitted record back to an earlier stage -> succeeds (GAP)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Revert Stage',
        admissionCode: `${RUN}-AD-B12`,
        stageId: stageAdmittedId,
        status: 'ADMITTED'
      }
    })

    // Move to "New" stage (not won, not lost)
    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        stageId: stageNewId
      })
    })
    const res = await updateAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(200)

    const updated = await prisma.admission.findUnique({
      where: { id: adm.id }
    })
    expect(updated?.stageId).toBe(stageNewId)
    // Fixed: status auto-reverts to IN_PROGRESS when moving off isWon/isLost stage
    expect(updated?.status).toBe('IN_PROGRESS')
  })

  it('B13: Move record to Rejected (status REJECTED), then move to Admitted (status ADMITTED) -> no leftovers', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Reject then Admit',
        admissionCode: `${RUN}-AD-B13`,
        stageId: stageNewId,
        status: 'IN_PROGRESS'
      }
    })

    // Move to Rejected
    const reqReject = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        stageId: stageRejectedId,
        rejectionReason: 'Failed criteria'
      })
    })
    const resReject = await updateAdmission(reqReject, { params: { id: adm.id } })
    expect(resReject.status).toBe(200)
    
    let updated = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(updated?.status).toBe('REJECTED')
    expect(updated?.rejectionReason).toBe('Failed criteria')

    // Move to Admitted
    const reqAdmit = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        stageId: stageAdmittedId
      })
    })
    const resAdmit = await updateAdmission(reqAdmit, { params: { id: adm.id } })
    expect(resAdmit.status).toBe(200)

    updated = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(updated?.status).toBe('ADMITTED')
    // Fixed: rejection reason is cleared when moving to isWon (ADMITTED) status
    expect(updated?.rejectionReason).toBeNull()
  })

  it('B14: Move record to "Docs Uploaded" stage with zero docs -> succeeds (GAP)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'No Docs stage',
        admissionCode: `${RUN}-AD-B14`,
        stageId: stageNewId
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        stageId: stageDocsRequiredId
      })
    })
    const res = await updateAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(422)

    const updated = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(updated?.stageId).toBe(stageNewId)
  })

  // C. Document upload
  it('C15 & C16 & C17: Binary upload checks via /api/v1/files/upload', async () => {
    // Setup file upload requests
    // C15: Under 10MB, allowed extension -> succeeds
    const formDataOk = new FormData()
    const fileOk = new Blob(['dummy pdf content'], { type: 'application/pdf' })
    formDataOk.append('file', fileOk, 'test-doc.pdf')
    formDataOk.append('category', 'documents')

    const reqOk = new NextRequest('http://localhost/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'x-user-id': adminId,
        'x-org-id': orgId
      },
      body: formDataOk
    })
    const resOk = await uploadFile(reqOk)
    expect(resOk.status).toBe(200)
    const dataOk = await resOk.json()
    expect(dataOk.success).toBe(true)
    expect(dataOk.url).toBeDefined()

    // C16: Over 10MB -> rejected
    const formDataLarge = new FormData()
    // Create a 10.1 MB buffer
    const largeBuffer = Buffer.alloc(10.1 * 1024 * 1024)
    const fileLarge = new Blob([largeBuffer], { type: 'application/pdf' })
    formDataLarge.append('file', fileLarge, 'large-doc.pdf')

    const reqLarge = new NextRequest('http://localhost/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'x-user-id': adminId,
        'x-org-id': orgId
      },
      body: formDataLarge
    })
    const resLarge = await uploadFile(reqLarge)
    expect(resLarge.status).toBe(400)
    const dataLarge = await resLarge.json()
    expect(dataLarge.error).toContain('File too large')

    // C17: Disallowed extension -> rejected
    const formDataBadExt = new FormData()
    const fileBadExt = new Blob(['dummy exe content'], { type: 'application/octet-stream' })
    formDataBadExt.append('file', fileBadExt, 'malicious.exe')

    const reqBadExt = new NextRequest('http://localhost/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'x-user-id': adminId,
        'x-org-id': orgId
      },
      body: formDataBadExt
    })
    const resBadExt = await uploadFile(reqBadExt)
    expect(resBadExt.status).toBe(400)
    const dataBadExt = await resBadExt.json()
    expect(dataBadExt.error).toContain('File type not allowed')
  })

  it('C18: Register document metadata -> scanStatus PENDING. Skip metadata step -> leaves orphaned S3 (GAP)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Doc Register',
        admissionCode: `${RUN}-AD-C18`
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/documents`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'test-doc.pdf',
        type: 'PDF',
        url: 'https://test-bucket.s3.amazonaws.com/uploads/orgId/documents/test-file.pdf',
        sizeBytes: 1024
      })
    })

    const res = await registerDocument(req, { params: { id: adm.id } })
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.data.scanStatus).toBe('PENDING')

    // GAP: S3 upload happened, but if network drops before registering metadata, there's no DB row linking it.
  })

  it('C19: Approve/reject document as admin (succeeds) vs non-admin (blocked)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Doc Review',
        admissionCode: `${RUN}-AD-C19`
      }
    })

    const doc = await prisma.admissionDocument.create({
      data: {
        orgId,
        admissionId: adm.id,
        name: 'review-doc.pdf',
        type: 'PDF',
        url: 'https://test-bucket.s3.amazonaws.com/review-doc.pdf'
      }
    })

    // Try status update as Counsellor (non-admin) -> should fail (blocked in roles filter)
    const reqCounsellor = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/documents/${doc.id}/status`, {
      method: 'PUT',
      headers: headersCounsellor,
      body: JSON.stringify({
        scanStatus: 'APPROVED'
      })
    })
    const resCounsellor = await updateDocumentStatus(reqCounsellor, { params: { id: adm.id, docId: doc.id } })
    expect(resCounsellor.status).toBe(403)

    // Try status update as Org Admin -> should succeed
    const reqAdmin = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/documents/${doc.id}/status`, {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        scanStatus: 'APPROVED'
      })
    })
    const resAdmin = await updateDocumentStatus(reqAdmin, { params: { id: adm.id, docId: doc.id } })
    expect(resAdmin.status).toBe(200)

    const updatedDoc = await prisma.admissionDocument.findUnique({ where: { id: doc.id } })
    expect(updatedDoc?.scanStatus).toBe('APPROVED')
  })

  it('C20: Delete document -> performs soft delete', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Doc Delete',
        admissionCode: `${RUN}-AD-C20`
      }
    })

    const doc = await prisma.admissionDocument.create({
      data: {
        orgId,
        admissionId: adm.id,
        name: 'delete-doc.pdf',
        type: 'PDF',
        url: 'https://test-bucket.s3.amazonaws.com/delete-doc.pdf'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/documents/${doc.id}`, {
      method: 'DELETE',
      headers: headersAdmin
    })
    const res = await deleteDocument(req, { params: { id: adm.id, docId: doc.id } })
    expect(res.status).toBe(200)

    const dbDoc = await prisma.admissionDocument.findUnique({ where: { id: doc.id } })
    expect(dbDoc?.deletedAt).not.toBeNull() // Soft deleted

    // Check GET documents doesn't list it
    const reqGet = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/documents`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resGet = await listDocuments(reqGet, { params: { id: adm.id } })
    expect(resGet.status).toBe(200)
    const docsList = await resGet.json()
    expect(docsList.data.some((d: any) => d.id === doc.id)).toBe(false)
  })

  // D. Convert to student
  it('D21 & D24: Convert ADMITTED admission -> succeeds, creates Student with normalized grade, Admission untouched', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Admitted Kid',
        admissionCode: `${RUN}-AD-D21`,
        status: 'ADMITTED',
        phone: '+919999900030',
        email: 'guardian@gmail.com',
        gradeSought: 'lkg' // raw lead format
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/convert`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        rollNumber: 'R001',
        section: 'A',
        guardianName: 'Guardian One'
      })
    })

    const res = await convertAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.data.student).toBeDefined()
    expect(resBody.data.student.studentCode).toContain('STU-')

    // D21 details
    const student = await prisma.student.findUnique({
      where: { id: resBody.data.student.id }
    })
    expect(student?.name).toBe('Admitted Kid')
    expect(student?.guardianPhone).toBe('+919999900030')
    expect(student?.guardianEmail).toBe('guardian@gmail.com')
    expect(student?.rollNumber).toBe('R001')
    expect(student?.section).toBe('A')
    expect(student?.guardianName).toBe('Guardian One')
    // Grade normalized: "lkg" -> "LKG"
    expect(student?.gradeLabel).toBe('LKG')

    // D24 details: admission row is untouched
    const admissionAfter = await prisma.admission.findUnique({
      where: { id: adm.id }
    })
    expect(admissionAfter?.deletedAt).toBeNull()
    expect(admissionAfter?.archivedAt).toBeNull()
    expect(admissionAfter?.status).toBe('ADMITTED')
  })

  it('D22: Convert non-admitted admission -> blocked', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'InProgress Kid',
        admissionCode: `${RUN}-AD-D22`,
        status: 'IN_PROGRESS'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/convert`, {
      method: 'POST',
      headers: headersAdmin
    })
    const res = await convertAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(422) // Business rule block is 422
    const data = await res.json()
    expect(data.error).toContain('must be in Admitted status')
  })

  it('D23: Double-convert probe -> blocked by unique constraint in DB (fails on second create)', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Double Convert Kid',
        admissionCode: `${RUN}-AD-D23`,
        status: 'ADMITTED'
      }
    })

    // First convert
    const req1 = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/convert`, {
      method: 'POST',
      headers: headersAdmin
    })
    const res1 = await convertAdmission(req1, { params: { id: adm.id } })
    expect(res1.status).toBe(201)

    // Second convert -> database throws unique constraint violation (P2002) on admissionId unique field.
    // The compose wrapper catches the error and returns a 500 or 409 depending on the prisma error handler.
    const req2 = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/convert`, {
      method: 'POST',
      headers: headersAdmin
    })
    const res2 = await convertAdmission(req2, { params: { id: adm.id } })
    expect(res2.status).not.toBe(201) // Will fail (usually returns 400 or 500 error)
  })

  // E. Archive/delete lifecycle
  it('E25 & E26: Archive / unarchive admission', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Archive Kid',
        admissionCode: `${RUN}-AD-E25`
      }
    })

    // 1. Archive it
    const reqArc = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/archive`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ archived: true })
    })
    const resArc = await archiveAdmission(reqArc, { params: { id: adm.id } })
    expect(resArc.status).toBe(200)

    // Verify it is archived in DB
    let dbAdm = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(dbAdm?.archivedAt).not.toBeNull()

    // Verify hidden from default list (where archived=false)
    const reqListDefault = new NextRequest(`http://localhost/api/v1/admissions`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resListDefault = await listAdmissions(reqListDefault)
    expect(resListDefault.status).toBe(200)
    const dataListDefault = await resListDefault.json()
    expect(dataListDefault.admissions.some((a: any) => a.id === adm.id)).toBe(false)

    // Verify visible in archived list (archived=true query param)
    const reqListArchived = new NextRequest(`http://localhost/api/v1/admissions?archived=true`, {
      method: 'GET',
      headers: headersAdmin
    })
    const resListArchived = await listAdmissions(reqListArchived)
    expect(resListArchived.status).toBe(200)
    const dataListArchived = await resListArchived.json()
    expect(dataListArchived.admissions.some((a: any) => a.id === adm.id)).toBe(true)

    // 2. Unarchive (E26)
    const reqUnarc = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}/archive`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ archived: false })
    })
    const resUnarc = await archiveAdmission(reqUnarc, { params: { id: adm.id } })
    expect(resUnarc.status).toBe(200)

    dbAdm = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(dbAdm?.archivedAt).toBeNull()
  })

  it('E27: Delete non-admitted, non-archived admission -> succeeds', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Deletable Kid',
        admissionCode: `${RUN}-AD-E27`
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'DELETE',
      headers: headersAdmin
    })
    const res = await deleteAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(200)

    const dbAdm = await prisma.admission.findUnique({ where: { id: adm.id } })
    expect(dbAdm?.deletedAt).not.toBeNull() // Soft deleted
  })

  it('E28: Delete an admitted admission -> blocked', async () => {
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Non Deletable Admitted Kid',
        admissionCode: `${RUN}-AD-E28`,
        status: 'ADMITTED'
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'DELETE',
      headers: headersAdmin
    })
    const res = await deleteAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(400) // Business rule block
    const data = await res.json()
    expect(data.error).toContain('Admitted applicants cannot be deleted')
  })

  it('E29: Delete admission with a linked student -> blocked', async () => {
    // Create admission with status IN_PROGRESS (e.g. if reverted or whatever)
    const adm = await prisma.admission.create({
      data: {
        orgId,
        applicantName: 'Has Student Kid',
        admissionCode: `${RUN}-AD-E29`,
        status: 'IN_PROGRESS'
      }
    })

    // Seed a student linking to it
    await prisma.student.create({
      data: {
        orgId,
        admissionId: adm.id,
        name: 'Has Student Kid',
        studentCode: `${RUN}-STU-E29`
      }
    })

    const req = new NextRequest(`http://localhost/api/v1/admissions/${adm.id}`, {
      method: 'DELETE',
      headers: headersAdmin
    })
    const res = await deleteAdmission(req, { params: { id: adm.id } })
    expect(res.status).toBe(400) // Business rule block
    const data = await res.json()
    expect(data.error).toContain('linked student record')
  })

  // F. Bulk actions
  it('F30 & F31 & F32: Bulk action behaviors simulation', async () => {
    const adm1 = await prisma.admission.create({
      data: { orgId, applicantName: 'Bulk 1', admissionCode: `${RUN}-AD-F30-1`, status: 'IN_PROGRESS' }
    })
    const adm2 = await prisma.admission.create({
      data: { orgId, applicantName: 'Bulk 2', admissionCode: `${RUN}-AD-F30-2`, status: 'ADMITTED' }
    })
    const adm3 = await prisma.admission.create({
      data: { orgId, applicantName: 'Bulk 3', admissionCode: `${RUN}-AD-F30-3`, status: 'IN_PROGRESS' }
    })

    // F30: Bulk move stage using Promise.all of PUTs. Both succeed because there is no API validation gating this.
    const resultsMove = await Promise.all([
      updateAdmission(
        new NextRequest(`http://localhost/api/v1/admissions/${adm1.id}`, {
          method: 'PUT',
          headers: headersAdmin,
          body: JSON.stringify({ stageId: stageAdmittedId })
        }),
        { params: { id: adm1.id } }
      ),
      updateAdmission(
        new NextRequest(`http://localhost/api/v1/admissions/${adm2.id}`, {
          method: 'PUT',
          headers: headersAdmin,
          body: JSON.stringify({ stageId: stageAdmittedId })
        }),
        { params: { id: adm2.id } }
      )
    ])
    expect(resultsMove[0].status).toBe(200)
    expect(resultsMove[1].status).toBe(200)

    // F31: Bulk delete using Promise.all of DELETEs. adm3 is IN_PROGRESS, adm2 is ADMITTED (since stage move made it won).
    // adm3 should succeed, adm2 should fail.
    const resultsDelete = await Promise.all([
      deleteAdmission(
        new NextRequest(`http://localhost/api/v1/admissions/${adm3.id}`, { method: 'DELETE', headers: headersAdmin }),
        { params: { id: adm3.id } }
      ),
      deleteAdmission(
        new NextRequest(`http://localhost/api/v1/admissions/${adm2.id}`, { method: 'DELETE', headers: headersAdmin }),
        { params: { id: adm2.id } }
      )
    ])
    expect(resultsDelete[0].status).toBe(200) // adm3 deleted
    expect(resultsDelete[1].status).toBe(400) // adm2 blocked

    // F32: Bulk assign counsellor to 20+ records sequentially-ish or Promise.all
    const leads = await Promise.all(
      Array.from({ length: 22 }, (_, i) =>
        prisma.lead.create({
          data: {
            orgId,
            parentName: `Bulk Parent ${i}`,
            phone: `9999900${String(i).padStart(2, '0')}`,
            leadCode: `${RUN}-F32-LD-${i}`,
            kidName: `Kid ${i}`
          }
        })
      )
    )

    const admissions20 = await Promise.all(
      leads.map((l, i) =>
        prisma.admission.create({
          data: { orgId, applicantName: `Bulk Assign ${i}`, admissionCode: `${RUN}-AD-F32-${i}`, leadId: l.id }
        })
      )
    )
    const resultsAssign = await Promise.all(
      admissions20.map(a =>
        updateAdmission(
          new NextRequest(`http://localhost/api/v1/admissions/${a.id}`, {
            method: 'PUT',
            headers: headersAdmin,
            body: JSON.stringify({ assignedToId: counsellorId })
          }),
          { params: { id: a.id } }
        )
      )
    )
    
    expect(resultsAssign.every(res => res.status === 200)).toBe(true)
  })
})
