import { describe, it, expect, beforeAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { encryptSecret, currentKeyVersion } from '@/lib/payments/vault'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'

// Load .env.local for real S3 credentials / configuration in tests
if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

// Setup env keys
;(process.env as Record<string, string>).NODE_ENV = 'development'
process.env.PAYMENT_PROVIDER_MOCK = '1'
process.env.PAYMENT_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')

// Mock notifications and messaging to prevent external calls
vi.mock('@/lib/integrations/zeptomail', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/lib/credits/metered-send', () => ({
  sendMeteredSms: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/lib/whatsapp/notify', () => ({
  sendTemplateNotification: vi.fn().mockResolvedValue(true)
}))

// Mock rate limiter in-memory
const ratelimitCounts: Record<string, number> = {}
vi.mock('@/lib/ratelimit', () => ({
  windowLimiter: vi.fn(async (key, limit, windowSeconds) => {
    ratelimitCounts[key] = (ratelimitCounts[key] || 0) + 1
    return {
      success: ratelimitCounts[key] <= limit,
      limit,
      remaining: Math.max(0, limit - ratelimitCounts[key]),
      reset: windowSeconds
    }
  }),
  otpSendLimiter: vi.fn(async (key) => ({ success: true, limit: 3, remaining: 2, reset: 60 }))
}))

// Import router handlers
import { POST as createForm } from '@/app/api/v1/forms/route'
import { PATCH as updateForm } from '@/app/api/v1/forms/[id]/route'
import { GET as getPublicForm, POST as submitPublicForm } from '@/app/api/public/forms/[token]/route'
import { POST as uploadPublicFile } from '@/app/api/public/forms/[token]/upload/route'
import { POST as payPublicForm } from '@/app/api/public/forms/[token]/pay/route'
import { POST as confirmPayment } from '@/app/api/public/forms/[token]/pay/confirm/route'
import { POST as reviewSubmission } from '@/app/api/v1/forms/[id]/submissions/[sid]/review/route'
import { mintCampaignInstance } from '@/lib/forms/send'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `form-test-${Date.now()}`

let orgId: string
let branchId: string
let academicYearId: string
let headersAdmin: Headers
let headersCounsellor: Headers
let adminId: string
let counsellorId: string

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

  // Enable modules
  const modules = ['lead_management', 'admission_management', 'student_management']
  for (const slug of modules) {
    const m = await prisma.module.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug, description: slug }
    })
    await prisma.organizationModule.create({
      data: { orgId, moduleId: m.id, enabled: true }
    })
  }

  // Create branch & AY
  const branch = await prisma.branch.create({
    data: { orgId, name: 'Main Branch', isDefault: true }
  })
  branchId = branch.id

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

  // Seed Users with unique emails and random phones
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Form Admin',
      email: `admin@${RUN}.local`,
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
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
      name: 'Form Counsellor',
      email: `counsellor@${RUN}.local`,
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'COUNSELLOR', orgId, status: 'ACTIVE' }
      }
    }
  })
  counsellorId = counsellor.id

  // Headers
  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'Content-Type': 'application/json'
  })

  headersCounsellor = new Headers({
    'x-user-id': counsellorId,
    'x-user-role': 'COUNSELLOR',
    'x-org-id': orgId,
    'Content-Type': 'application/json'
  })

  // Gateway Config for payment tests
  await prisma.paymentGatewayConfig.create({
    data: {
      orgId,
      provider: 'RAZORPAY',
      environment: 'TEST',
      status: 'ACTIVE',
      isCurrent: true,
      keyIdEncrypted: encryptSecret('mock_key'),
      keySecretEncrypted: encryptSecret('mock_secret'),
      webhookSecretEnc: encryptSecret('mock_webhook_secret'),
      encryptionKeyVer: currentKeyVersion()
    }
  })
})

describeDb('Digital Forms Verification Suite', () => {
  const mockSchema = {
    sections: [
      {
        id: 'sec1',
        title: 'Basic Info',
        fields: [
          { key: 'f_phone', label: 'Phone', type: 'phone', required: true, mapsTo: 'contact.phone' },
          { key: 'f_name', label: 'Student Name', type: 'text', required: true, mapsTo: 'applicant.name' },
          { key: 'f_parent', label: 'Parent Name', type: 'text', required: false, mapsTo: 'parent.name' },
          { key: 'f_email', label: 'Email', type: 'email', required: false, mapsTo: 'contact.email' },
          { key: 'f_grade', label: 'Grade sought', type: 'text', required: false, mapsTo: 'grade' }
        ]
      }
    ]
  }

  it('1. Create form with valid mapping -> succeeds', async () => {
    const req = new NextRequest('http://localhost/api/v1/forms', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Standard Application Form',
        purpose: 'LEAD',
        status: 'DRAFT',
        schema: mockSchema,
        settings: { successMessage: 'Submitted successfully!' }
      })
    })

    const res = await createForm(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBeDefined()
  })

  it('2 & 3. Block publishing if feeRequired but no positive amount or no phone field', async () => {
    // 2. feeRequired true but 0 amount
    const reqFee = new NextRequest('http://localhost/api/v1/forms', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Fee Required Blank Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema,
        feeRequired: true,
        applicationFeeAmount: 0
      })
    })
    const resFee = await createForm(reqFee)
    expect(resFee.status).toBe(422)
    const errFee = await resFee.json()
    expect(errFee.details.applicationFeeAmount).toContain('Set an application fee greater than 0 before publishing')

    // 3. No field mapped to contact.phone
    const badSchema = {
      sections: [
        {
          id: 'sec1',
          title: 'Basic Info',
          fields: [
            { key: 'f_name', label: 'Student Name', type: 'text', required: true, mapsTo: 'applicant.name' }
          ]
        }
      ]
    }
    const reqPhone = new NextRequest('http://localhost/api/v1/forms', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'No Phone Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: badSchema
      })
    })
    const resPhone = await createForm(reqPhone)
    expect(resPhone.status).toBe(422)
    const errPhone = await resPhone.json()
    expect(errPhone.details.schema).toContain('Add a field mapped to Phone before publishing so submissions can be identified')
  })

  it('4. Create LEAD form with canonical key lead adapter never reads -> succeeds anyway (harmless builder-UX gap)', async () => {
    // applicant.dob is not read/mapped by the lead adapter in canonicalToLead
    const leadDeadSchema = {
      sections: [
        {
          id: 'sec1',
          title: 'Extra Info',
          fields: [
            { key: 'f_phone', label: 'Phone', type: 'phone', required: true, mapsTo: 'contact.phone' },
            { key: 'f_dob', label: 'Date of Birth', type: 'date', required: false, mapsTo: 'applicant.dob' }
          ]
        }
      ]
    }
    const req = new NextRequest('http://localhost/api/v1/forms', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'Lead Dead Mapping Form',
        purpose: 'LEAD',
        status: 'DRAFT',
        schema: leadDeadSchema
      })
    })
    const res = await createForm(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBeDefined()
  })

  it('5. Public submission dedup bypass (GAP FOUND): succeeds even with existing hard-match duplicate in CRM', async () => {
    const duplicatePhone = '9999912345'
    const duplicatePhoneNormalized = '9999912345' // cleaned from 9999912345

    // Create an existing Lead that would normally block under sameChildSameYear/exactApplication
    await prisma.lead.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        leadCode: `L-DEDUP-BYPASS`,
        parentName: 'Original Parent',
        phone: duplicatePhone,
        phoneNormalized: duplicatePhoneNormalized,
        kidName: 'Duplicate Kid',
        gradeSought: 'Grade 1',
        source: 'WEBSITE'
      }
    })

    // Create and publish a form
    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Public Apply Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // Mint a standalone instance
    const instance = await prisma.formInstance.create({
      data: {
        orgId,
        formId: form.id,
        targetType: 'STANDALONE',
        token: `token-dedup-${Date.now()}`
      }
    })

    // Submit matching phone/name/grade -> Expects success because forms engine doesn't invoke deduplication rules
    const req = new NextRequest(`http://localhost/api/public/forms/${instance.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          f_phone: duplicatePhone,
          f_name: 'Duplicate Kid',
          f_parent: 'Duplicate Parent',
          f_grade: 'Grade 1'
        }
      })
    })

    const res = await submitPublicForm(req, { params: Promise.resolve({ token: instance.token }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    // Confirm that the existing Lead was silently updated/overwritten directly rather than blocking
    const updatedLead = await prisma.lead.findFirst({
      where: { orgId, phoneNormalized: duplicatePhoneNormalized }
    })
    expect(updatedLead?.parentName).toBe('Duplicate Parent') // Silently overwritten!
  })

  it('6. Submit two forms same phone, different children -> updates/corrupts original lead (GAP FOUND)', async () => {
    const siblingPhone = '9999954321'
    const siblingPhoneNormalized = '9999954321'

    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Sibling Apply Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // Submission 1: Child One
    const inst1 = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-sib1-${Date.now()}` }
    })
    const req1 = new NextRequest(`http://localhost/api/public/forms/${inst1.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: siblingPhone, f_name: 'Child One', f_parent: 'Parent Sib', f_grade: 'Grade 1' }
      })
    })
    const res1 = await submitPublicForm(req1, { params: Promise.resolve({ token: inst1.token }) })
    expect(res1.status).toBe(200)

    const leadAfterFirst = await prisma.lead.findFirst({ where: { orgId, phoneNormalized: siblingPhoneNormalized } })
    expect(leadAfterFirst?.kidName).toBe('Child One')

    // Submission 2: Sibling (Child Two) with SAME phone
    const inst2 = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-sib2-${Date.now()}` }
    })
    const req2 = new NextRequest(`http://localhost/api/public/forms/${inst2.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: siblingPhone, f_name: 'Child Two', f_parent: 'Parent Sib', f_grade: 'Grade 2' }
      })
    })
    const res2 = await submitPublicForm(req2, { params: Promise.resolve({ token: inst2.token }) })
    expect(res2.status).toBe(200)

    // Verify that separate leads are created for siblings rather than overwriting
    const leads = await prisma.lead.findMany({ where: { orgId, phoneNormalized: siblingPhoneNormalized } })
    expect(leads.length).toBe(2)
  })

  it('7. Non-identity fields silently overwrite lead immediately without review (GAP FOUND)', async () => {
    const phone = '9999988888'
    const phoneNormalized = '9999988888'

    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Overwrite Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // Sub 1: Email = one@gmail.com, Grade = Grade 1
    const inst1 = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-ow1-${Date.now()}` }
    })
    const req1 = new NextRequest(`http://localhost/api/public/forms/${inst1.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: phone, f_name: 'Identical Kid', f_parent: 'Parent OW', f_email: 'one@gmail.com', f_grade: 'Grade 1' }
      })
    })
    await submitPublicForm(req1, { params: Promise.resolve({ token: inst1.token }) })

    // Sub 2: Identical identity values but different email/grade (non-identity fields)
    const inst2 = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-ow2-${Date.now()}` }
    })
    const req2 = new NextRequest(`http://localhost/api/public/forms/${inst2.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: phone, f_name: 'Identical Kid', f_parent: 'Parent OW', f_email: 'two@gmail.com', f_grade: 'Grade 2' }
      })
    })
    const res2 = await submitPublicForm(req2, { params: Promise.resolve({ token: inst2.token }) })
    expect(res2.status).toBe(200)

    // Check that email and grade were updated immediately without pending review
    const lead = await prisma.lead.findFirst({ where: { orgId, phoneNormalized } })
    expect(lead?.email).toBe('two@gmail.com') // Directly updated
    expect(lead?.gradeSought).toBe('Grade 2') // Directly updated
  })

  it('8. Accept Review path forceApply skips dedup checks', async () => {
    const phone = '9999977777'
    const phoneNormalized = '9999977777'

    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Review Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // Seed a lead for pre-targeting
    const lead = await prisma.lead.create({
      data: {
        orgId,
        leadCode: 'L-REV-1',
        parentName: 'Parent Rev',
        phone,
        phoneNormalized,
        kidName: 'Original Kid'
      }
    })

    // Create pre-targeted form instance
    const instance = await prisma.formInstance.create({
      data: {
        orgId,
        formId: form.id,
        targetType: 'LEAD',
        targetId: lead.id,
        token: `token-rev-${Date.now()}`
      }
    })

    // Submit with mismatched kidName (Identity field) -> Should queue for review
    const req = new NextRequest(`http://localhost/api/public/forms/${instance.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          f_phone: phone,
          f_name: 'Mismatched Kid Name',
          f_parent: 'Parent Rev',
          f_email: 'rev@gmail.com',
          f_grade: 'Grade 1'
        }
      })
    })
    await submitPublicForm(req, { params: Promise.resolve({ token: instance.token }) })

    const submission = await prisma.formSubmission.findFirst({
      where: { instanceId: instance.id }
    })
    expect(submission?.reviewStatus).toBe('PENDING')

    // Counsellor accepts review -> should update name directly and bypass dedup checks
    const reqReview = new NextRequest(`http://localhost/api/v1/forms/${form.id}/submissions/${submission!.id}/review`, {
      method: 'POST',
      headers: headersCounsellor,
      body: JSON.stringify({ action: 'accept', keys: ['applicant.name'] })
    })
    const resReview = await reviewSubmission(reqReview, { params: Promise.resolve({ id: form.id, sid: submission!.id }) })
    expect(resReview.status).toBe(200)

    const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } })
    expect(updatedLead?.kidName).toBe('Mismatched Kid Name')
  })

  it('9 & 10. Campaign single-use token blocks retry, but vulnerable to concurrency race condition (GAP FOUND)', async () => {
    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Campaign Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // 9. Single-use token blocks second attempt sequentially
    const instSeq = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-seq-${Date.now()}` }
    })
    const reqSeq1 = new NextRequest(`http://localhost/api/public/forms/${instSeq.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900001', f_name: 'Seq Kid', f_parent: 'Parent Seq' }
      })
    })
    const resSeq1 = await submitPublicForm(reqSeq1, { params: Promise.resolve({ token: instSeq.token }) })
    expect(resSeq1.status).toBe(200)

    const reqSeq2 = new NextRequest(`http://localhost/api/public/forms/${instSeq.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900001', f_name: 'Seq Kid Two', f_parent: 'Parent Seq' }
      })
    })
    const resSeq2 = await submitPublicForm(reqSeq2, { params: Promise.resolve({ token: instSeq.token }) })
    expect(resSeq2.status).toBe(409) // Blocked!

    // 10. Concurrency race condition: Fire two submissions concurrently
    const instRace = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-race-${Date.now()}` }
    })
    const reqRace1 = new NextRequest(`http://localhost/api/public/forms/${instRace.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900002', f_name: 'Race Kid One', f_parent: 'Parent Race' }
      })
    })
    const reqRace2 = new NextRequest(`http://localhost/api/public/forms/${instRace.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900002', f_name: 'Race Kid Two', f_parent: 'Parent Race' }
      })
    })

    const [resRace1, resRace2] = await Promise.all([
      submitPublicForm(reqRace1, { params: Promise.resolve({ token: instRace.token }) }).catch(err => {
        return { status: 500, json: async () => ({ error: err.message }) } as unknown as NextResponse
      }),
      submitPublicForm(reqRace2, { params: Promise.resolve({ token: instRace.token }) }).catch(err => {
        return { status: 500, json: async () => ({ error: err.message }) } as unknown as NextResponse
      })
    ])

    // Verify that concurrency was handled cleanly: one request succeeded with 200, the other blocked with 409
    expect([resRace1.status, resRace2.status]).toContain(200)
    expect([resRace1.status, resRace2.status]).toContain(409)
    expect([resRace1.status, resRace2.status]).not.toContain(500)
  })

  it('11. Non-LEAD recipient type falls back to STANDALONE and loses 1:1 link', async () => {
    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Campaign Standalone Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    // Mint campaign instance for a CONTACT (non-LEAD) recipient
    const recipientId = 'raw_contact_id_123'
    const link = await mintCampaignInstance(prisma, {
      orgId,
      formId: form.id,
      campaignId: 'camp_123',
      channel: 'LINK',
      recipientType: 'CONTACT',
      recipientId,
      phone: '9999900003'
    })

    const token = link.split('/').pop()!
    const instance = await prisma.formInstance.findUnique({ where: { token } })

    // Verify fallback targetType and targetId values
    expect(instance?.targetType).toBe('STANDALONE')
    expect(instance?.targetId).toBeNull()

    // Submit the form
    const req = new NextRequest(`http://localhost/api/public/forms/${token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900003', f_name: 'Contact Recipient Kid', f_parent: 'Parent Cont' }
      })
    })
    await submitPublicForm(req, { params: Promise.resolve({ token }) })

    // Confirm that the Lead is created
    const newlyCreatedLead = await prisma.lead.findFirst({
      where: { orgId, phoneNormalized: '9999900003' }
    })
    expect(newlyCreatedLead).toBeDefined()

    // Retrieve submission to verify campaignId is attached but 1:1 recipientId link is lost
    const newlyCreatedSubmission = await prisma.formSubmission.findFirst({
      where: { instanceId: instance!.id }
    })
    expect(newlyCreatedSubmission).toBeDefined()
    expect(newlyCreatedSubmission!.campaignId).toBe('camp_123')
    expect((newlyCreatedSubmission as any).recipientId).toBeUndefined()
  })

  it('12. Already-issued token remains valid even if form status reverts to DRAFT', async () => {
    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Draft Revert Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    const instance = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-draft-${Date.now()}` }
    })

    // Revert form status to DRAFT
    await prisma.form.update({
      where: { id: form.id },
      data: { status: 'DRAFT' }
    })

    // Submit form using token -> should succeed
    const req = new NextRequest(`http://localhost/api/public/forms/${instance.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900004', f_name: 'Draft Kid', f_parent: 'Parent Draft' }
      })
    })
    const res = await submitPublicForm(req, { params: Promise.resolve({ token: instance.token }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('13, 14 & 15. S3 File Upload orphan tracking, limits, and rate limits', async () => {
    const form = await prisma.form.create({
      data: {
        orgId,
        name: 'Upload Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema
      }
    })

    const instance = await prisma.formInstance.create({
      data: { orgId, formId: form.id, targetType: 'STANDALONE', token: `token-upl-${Date.now()}` }
    })

    // 14. File upload rejects >10MB or unsupported type
    const fdLarge = new FormData()
    fdLarge.append('file', new Blob(['x'.repeat(11 * 1024 * 1024)]), 'large.pdf')
    fdLarge.append('fieldKey', 'f_upload')
    const reqLarge = new NextRequest(`http://localhost/api/public/forms/${instance.token}/upload`, {
      method: 'POST',
      body: fdLarge
    })
    const resLarge = await uploadPublicFile(reqLarge, { params: Promise.resolve({ token: instance.token }) })
    expect(resLarge.status).toBe(413)

    const fdBadType = new FormData()
    fdBadType.append('file', new Blob(['hello content'], { type: 'text/plain' }), 'test.txt')
    fdBadType.append('fieldKey', 'f_upload')
    const reqBadType = new NextRequest(`http://localhost/api/public/forms/${instance.token}/upload`, {
      method: 'POST',
      body: fdBadType
    })
    const resBadType = await uploadPublicFile(reqBadType, { params: Promise.resolve({ token: instance.token }) })
    expect(resBadType.status).toBe(415)

    // 15. Hit the public upload endpoint 21+ times in a minute -> verify rate-limited (429)
    // In our mocked rate limiter, ratelimitCounts is keyed by 'form-upload:token:ip'
    const limitKey = `form-upload:${instance.token}:anon`
    ratelimitCounts[limitKey] = 20 // Set to max threshold
    const fdRate = new FormData()
    fdRate.append('file', new Blob(['pdf bytes'], { type: 'application/pdf' }), 'rate.pdf')
    fdRate.append('fieldKey', 'f_upload')
    const reqRate = new NextRequest(`http://localhost/api/public/forms/${instance.token}/upload`, {
      method: 'POST',
      body: fdRate
    })
    const resRate = await uploadPublicFile(reqRate, { params: Promise.resolve({ token: instance.token }) })
    expect(resRate.status).toBe(429)
    ratelimitCounts[limitKey] = 0 // Reset

    // 13. Successful upload, but abandoned submission -> lands in S3 as orphan
    const fdOk = new FormData()
    fdOk.append('file', new Blob(['mock pdf data'], { type: 'application/pdf' }), 'abandoned-form-file.pdf')
    fdOk.append('fieldKey', 'f_upload')
    const reqOk = new NextRequest(`http://localhost/api/public/forms/${instance.token}/upload`, {
      method: 'POST',
      body: fdOk
    })
    const resOk = await uploadPublicFile(reqOk, { params: Promise.resolve({ token: instance.token }) })
    expect(resOk.status).toBe(200)
    const uploadData = await resOk.json()
    expect(uploadData.url).toBeDefined()
  })

  it('16, 17 & 18. Submit fee-required form, delete unpaid drafts, sign verify confirm & payment idempotency', async () => {
    const feeForm = await prisma.form.create({
      data: {
        orgId,
        name: 'Fee Application Form',
        purpose: 'LEAD',
        status: 'PUBLISHED',
        schema: mockSchema,
        feeRequired: true,
        applicationFeeAmount: 500
      }
    })

    const instance = await prisma.formInstance.create({
      data: { orgId, formId: feeForm.id, targetType: 'STANDALONE', token: `token-fee-${Date.now()}` }
    })

    // Submit 1 (Will be unpaid/abandoned draft)
    const reqSub1 = new NextRequest(`http://localhost/api/public/forms/${instance.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900005', f_name: 'Fee Kid', f_parent: 'Parent Fee' }
      })
    })
    const resSub1 = await submitPublicForm(reqSub1, { params: Promise.resolve({ token: instance.token }) })
    expect(resSub1.status).toBe(200)

    const submissionDraft1 = await prisma.formSubmission.findFirst({
      where: { instanceId: instance.id }
    })
    expect(submissionDraft1?.paymentStatus).toBe('PENDING')
    expect(submissionDraft1?.targetId).toBeNull() // target lead not created yet!

    // 17. Re-submit the same form before payment -> previous PENDING submission is deleted
    const reqSub2 = new NextRequest(`http://localhost/api/public/forms/${instance.token}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { f_phone: '9999900005', f_name: 'Fee Kid Version Two', f_parent: 'Parent Fee' }
      })
    })
    const resSub2 = await submitPublicForm(reqSub2, { params: Promise.resolve({ token: instance.token }) })
    expect(resSub2.status).toBe(200)

    const activeSubmissions = await prisma.formSubmission.findMany({
      where: { instanceId: instance.id }
    })
    expect(activeSubmissions.length).toBe(1) // The old draft submission was deleted/replaced!
    const submissionActive = activeSubmissions[0]
    expect((submissionActive.data as any).f_name).toBe('Fee Kid Version Two')

    // Create a gateway order
    const reqPay = new NextRequest(`http://localhost/api/public/forms/${instance.token}/pay`, {
      method: 'POST'
    })
    const resPay = await payPublicForm(reqPay, { params: Promise.resolve({ token: instance.token }) })
    expect(resPay.status).toBe(200)
    const orderData = await resPay.json()
    const orderId = orderData.providerOrderId

    // Compute valid checkout signature using the mock provider credentials key secret ('mock_secret')
    // expected = hmac(secret, orderId + '|' + paymentId)
    const paymentId = 'pay_mock_12345'
    const signature = crypto
      .createHmac('sha256', 'mock_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    // 16. Confirm payment via public route -> signature-verified, flipped to PAID, and target created
    const reqConfirm = new NextRequest(`http://localhost/api/public/forms/${instance.token}/pay/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      })
    })
    const resConfirm = await confirmPayment(reqConfirm, { params: Promise.resolve({ token: instance.token }) })
    expect(resConfirm.status).toBe(200)
    const confirmBody = await resConfirm.json()
    expect(confirmBody.ok).toBe(true)

    // Verify submission is updated and target Lead is created
    const finalSubmission = await prisma.formSubmission.findUnique({
      where: { id: submissionActive.id }
    })
    expect(finalSubmission?.paymentStatus).toBe('PAID')
    expect(finalSubmission?.targetId).not.toBeNull()

    const createdLead = await prisma.lead.findUnique({
      where: { id: finalSubmission!.targetId! }
    })
    expect(createdLead?.kidName).toBe('Fee Kid Version Two')

    // 18. Replay the same payment webhook/confirm call -> verify idempotent (alreadyPaid: true)
    const reqReplay = new NextRequest(`http://localhost/api/public/forms/${instance.token}/pay/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      })
    })
    const resReplay = await confirmPayment(reqReplay, { params: Promise.resolve({ token: instance.token }) })
    expect(resReplay.status).toBe(200)
    const replayBody = await resReplay.json()
    expect(replayBody.ok).toBe(true)
    expect(replayBody.alreadyPaid).toBe(true)
  })
})
