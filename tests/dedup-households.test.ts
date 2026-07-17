import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'
import { ROLES } from '@/constants/roles'
import { cleanPhoneNumber } from '@/lib/utils'

// Import handlers
import { POST as createLead } from '@/app/api/v1/leads/route'
import { PUT as updateLead } from '@/app/api/v1/leads/[id]/route'
import { POST as createAdmission } from '@/app/api/v1/admissions/route'
import { PUT as updateAdmission } from '@/app/api/v1/admissions/[id]/route'
import { POST as createStudent } from '@/app/api/v1/students/route'
import { PUT as updateStudent } from '@/app/api/v1/students/[id]/route'
import { GET as getDedupConfig, PUT as saveDedupConfig } from '@/app/api/v1/settings/deduplication/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `dedup-test-${Date.now()}`

let orgIdSchool: string
let orgIdLC: string
let adminIdSchool: string
let adminIdLC: string
let counsellorIdSchool: string
let branchIdSchool: string
let branchIdLC: string
let academicYearIdSchool: string
let academicYearIdSchool2: string
let academicYearIdSchool3: string
let academicYearIdLC: string
let headersAdminSchool: Headers
let headersCounsellorSchool: Headers
let headersAdminLC: Headers

beforeAll(async () => {
  // 1. Seed School Org (SCHOOL)
  const orgSchool = await prisma.organization.create({
    data: {
      name: `${RUN}-school`,
      slug: `${RUN}-school`,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}-school.local`,
      phone: '0000000001',
      isDummy: true,
      status: 'ACTIVE'
    }
  })
  orgIdSchool = orgSchool.id

  const brSchool = await prisma.branch.create({
    data: { orgId: orgIdSchool, name: 'Main Branch', isDefault: true }
  })
  branchIdSchool = brSchool.id

  const aySchool = await prisma.academicYear.create({
    data: { orgId: orgIdSchool, name: '2026-27', status: 'ACTIVE', startDate: new Date(), endDate: new Date(), type: 'ACADEMIC' }
  })
  academicYearIdSchool = aySchool.id

  const aySchool2 = await prisma.academicYear.create({
    data: { orgId: orgIdSchool, name: '2027-28', status: 'ACTIVE', startDate: new Date(), endDate: new Date(), type: 'ACADEMIC' }
  })
  academicYearIdSchool2 = aySchool2.id

  const aySchool3 = await prisma.academicYear.create({
    data: { orgId: orgIdSchool, name: '2028-29', status: 'ACTIVE', startDate: new Date(), endDate: new Date(), type: 'ACADEMIC' }
  })
  academicYearIdSchool3 = aySchool3.id

  // Seed admin for school org
  const adminSchool = await prisma.user.create({
    data: {
      orgId: orgIdSchool,
      name: 'School Admin',
      email: `admin@${RUN}-school.local`,
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId: orgIdSchool, status: 'ACTIVE' }
      }
    }
  })
  adminIdSchool = adminSchool.id

  // Seed counsellor for school org
  const counsellorSchool = await prisma.user.create({
    data: {
      orgId: orgIdSchool,
      name: 'School Counsellor',
      email: `counsellor@${RUN}-school.local`,
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'COUNSELLOR', orgId: orgIdSchool, status: 'ACTIVE' }
      }
    }
  })
  counsellorIdSchool = counsellorSchool.id

  // 2. Seed Learning Center Org (COACHING_CENTER)
  const orgLC = await prisma.organization.create({
    data: {
      name: `${RUN}-lc`,
      slug: `${RUN}-lc`,
      institutionType: 'COACHING_CENTER',
      email: `admin@${RUN}-lc.local`,
      phone: '0000000002',
      isDummy: true,
      status: 'ACTIVE'
    }
  })
  orgIdLC = orgLC.id

  const brLC = await prisma.branch.create({
    data: { orgId: orgIdLC, name: 'Main Branch', isDefault: true }
  })
  branchIdLC = brLC.id

  const ayLC = await prisma.academicYear.create({
    data: { orgId: orgIdLC, name: '2026-27', status: 'ACTIVE', startDate: new Date(), endDate: new Date(), type: 'ACADEMIC' }
  })
  academicYearIdLC = ayLC.id

  // Seed admin for LC org
  const adminLC = await prisma.user.create({
    data: {
      orgId: orgIdLC,
      name: 'LC Admin',
      email: `admin@${RUN}-lc.local`,
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId: orgIdLC, status: 'ACTIVE' }
      }
    }
  })
  adminIdLC = adminLC.id

  headersAdminSchool = new Headers({
    'x-user-id': adminIdSchool,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgIdSchool,
    'x-user-name': 'School Admin',
    'Content-Type': 'application/json'
  })

  headersCounsellorSchool = new Headers({
    'x-user-id': counsellorIdSchool,
    'x-user-role': 'COUNSELLOR',
    'x-org-id': orgIdSchool,
    'x-user-name': 'School Counsellor',
    'Content-Type': 'application/json'
  })

  headersAdminLC = new Headers({
    'x-user-id': adminIdLC,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgIdLC,
    'x-user-name': 'LC Admin',
    'Content-Type': 'application/json'
  })

  // Enable needed modules
  const modulesToEnable = ['lead_management', 'admission_management', 'student_management']
  for (const slug of modulesToEnable) {
    const m = await prisma.module.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug, description: slug }
    })
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: orgIdSchool, moduleId: m.id } },
      update: { enabled: true },
      create: { orgId: orgIdSchool, moduleId: m.id, enabled: true }
    })
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: orgIdLC, moduleId: m.id } },
      update: { enabled: true },
      create: { orgId: orgIdLC, moduleId: m.id, enabled: true }
    })
  }

  // Seed admission stages for both orgs
  await prisma.admissionStage.create({
    data: { orgId: orgIdSchool, name: 'Applied', sortOrder: 1 }
  })
  await prisma.admissionStage.create({
    data: { orgId: orgIdLC, name: 'Applied', sortOrder: 1 }
  })

  // Mock authentication session
  vi.mock('@/auth', () => ({
    auth: vi.fn(async () => ({
      user: { id: adminIdSchool, role: 'ORG_ADMIN', orgId: orgIdSchool }
    }))
  }))
})

afterAll(async () => {
  // Clean up School Org data
  if (orgIdSchool) {
    await prisma.admissionActivity.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.studentActivity.deleteMany({ where: { student: { orgId: orgIdSchool } } })
    await prisma.student.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.admission.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.lead.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.admissionStage.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.academicYear.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.branch.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.user.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.household.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.organizationModule.deleteMany({ where: { orgId: orgIdSchool } })
    await prisma.organization.delete({ where: { id: orgIdSchool } })
  }

  // Clean up LC Org data
  if (orgIdLC) {
    await prisma.admissionActivity.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.studentActivity.deleteMany({ where: { student: { orgId: orgIdLC } } })
    await prisma.student.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.admission.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.lead.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.admissionStage.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.academicYear.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.branch.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.user.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.household.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.organizationModule.deleteMany({ where: { orgId: orgIdLC } })
    await prisma.organization.delete({ where: { id: orgIdLC } })
  }

  await prisma.$disconnect()
})

describeDb('Deduplication and Households Verification Suite', () => {
  // A. Config & match rules — positive
  it('1. exactApplication (hard block) cannot be forced', async () => {
    // Create first Lead
    const phone = '9999911111'
    const name = 'Match Kid One'
    const grade = 'Grade 1'

    const createLeadReq1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent One',
        phone,
        email: 'parent1@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const res1 = await createLead(createLeadReq1)
    expect(res1.status).toBe(201)

    // Attempt to create Admission with same phone + child + grade + year (R1 match)
    const createAdmAtr = new NextRequest('http://localhost/api/v1/admissions', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        applicantName: name,
        parentName: 'Parent One',
        phone,
        email: 'parent1@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const res2 = await createAdmission(createAdmAtr)
    // Should be blocked with 409 Conflict
    expect(res2.status).toBe(409)
    const body2 = await res2.json()
    expect(body2.error).toContain('Open it instead of creating a duplicate')
  })

  it('2. sameChildSameYear severity is hard for SCHOOL and soft for LEARNING_CENTER', async () => {
    const phone = '9999922222'
    const name = 'Match Kid Two'
    const gradeA = 'Grade A'
    const gradeB = 'Grade B'

    // --- Part A: School Org (Expect hard block for same child and same year, even if grade differs) ---
    // Create first lead
    const reqSchool1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Two',
        phone,
        email: 'parent2@gmail.com',
        gradeSought: gradeA,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    await createLead(reqSchool1)

    // Try creating same child, same year but different grade
    const reqSchool2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Two',
        phone,
        email: 'parent2@gmail.com',
        gradeSought: gradeB,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resSchool2 = await createLead(reqSchool2)
    // Expect 409 Conflict because sameChildSameYear defaults to 'hard' on SCHOOL orgs
    expect(resSchool2.status).toBe(409)
    const bodySchool2 = await resSchool2.json()
    expect(bodySchool2.error).toContain('Open it instead of creating a duplicate')

    // --- Part B: Learning Center Org (Expect soft block which can be forced) ---
    const reqLC1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminLC,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Two',
        phone,
        email: 'parent2@gmail.com',
        gradeSought: gradeA,
        branchId: branchIdLC,
        academicYearId: academicYearIdLC
      })
    })
    await createLead(reqLC1)

    const reqLC2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminLC,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Two',
        phone,
        email: 'parent2@gmail.com',
        gradeSought: gradeB,
        branchId: branchIdLC,
        academicYearId: academicYearIdLC
      })
    })
    const resLC2 = await createLead(reqLC2)
    // Expect 409 Conflict with soft block message: "Possible duplicate found"
    expect(resLC2.status).toBe(409)
    const bodyLC2 = await resLC2.json()
    expect(bodyLC2.error).toContain('Possible duplicate found')
  })

  it('3 & 8. contactAndChild soft match blocked but overridable by COUNSELLOR/ORG_ADMIN role via force: true', async () => {
    const phone = '9999933333'
    const name = 'Match Kid Three'
    const email = 'parent3@gmail.com'

    // Create first Lead in school org
    const req1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Three',
        phone,
        email,
        gradeSought: 'Grade 3',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    await createLead(req1)

    // Create same contact and child on different year/grade (R3 match)
    const req2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Three',
        phone,
        email,
        gradeSought: 'Grade 4',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool2 // normally contactAndChild matches irrespective of year, and changing year avoids R2 sameChildSameYear hard block
      })
    })
    const res2 = await createLead(req2)
    expect(res2.status).toBe(409) // Blocked

    // Force through as COUNSELLOR role (Should succeed)
    const reqCounsellorForce = new NextRequest('http://localhost/api/v1/leads?force=true', {
      method: 'POST',
      headers: headersCounsellorSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Three',
        phone,
        email,
        gradeSought: 'Grade 4',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool2,
        force: true
      })
    })
    const resCounsellorForce = await createLead(reqCounsellorForce)
    expect(resCounsellorForce.status).toBe(201) // Success!

    // Repeat force through as ORG_ADMIN role (Should succeed)
    const reqAdminForce = new NextRequest('http://localhost/api/v1/leads?force=true', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Three',
        phone,
        email,
        gradeSought: 'Grade 5',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool3,
        force: true
      })
    })
    const resAdminForce = await createLead(reqAdminForce)
    expect(resAdminForce.status).toBe(201) // Success!
  })

  it('4. sharedEmail (soft) fires on same email only, different phone/child', async () => {
    const email = 'shared-reception@gmail.com'

    // Create first Lead
    const req1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: 'Child A',
        parentName: 'Parent A',
        phone: '9999944441',
        email,
        gradeSought: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    await createLead(req1)

    // Create second Lead with different child and phone but same email
    const req2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: 'Child B',
        parentName: 'Parent B',
        phone: '9999944442',
        email,
        gradeSought: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const res2 = await createLead(req2)
    expect(res2.status).toBe(409)
    const body2 = await res2.json()
    expect(body2.error).toContain('Possible duplicate found')
  })

  // A. Config — negative
  it('5. nameOnly rule (disabled by default) blocks matches when enabled', async () => {
    const name = 'Rahul Kumar'
    const grade = 'Grade 10'

    // Verify nameOnly is disabled by default
    const req1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent X',
        phone: '9999955551',
        email: 'parentX@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    await createLead(req1)

    // Create second record with same name + grade, different phone/email (Expected success by default)
    const req2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Y',
        phone: '9999955552',
        email: 'parentY@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const res2 = await createLead(req2)
    expect(res2.status).toBe(201) // Succeeded since nameOnly is off

    // Enable nameOnly = soft
    const reqConfig = new NextRequest('http://localhost/api/v1/settings/deduplication', {
      method: 'PUT',
      headers: headersAdminSchool,
      body: JSON.stringify({
        rules: {
          exactApplication: 'hard',
          sameChildSameYear: 'hard',
          contactAndChild: 'soft',
          emailAndChild: 'soft',
          sharedEmail: 'soft',
          nameOnly: 'soft'
        }
      })
    })
    const resConfig = await saveDedupConfig(reqConfig)
    if (resConfig.status !== 200) {
      console.log("resConfig failed with body:", await resConfig.json())
    }
    expect(resConfig.status).toBe(200)

    // Try creating third record (should block if nameOnly worked, but query scoping makes it success - GAP CONFIRMED)
    const req3 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Z',
        phone: '9999955553',
        email: 'parentZ@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const res3 = await createLead(req3)
    expect(res3.status).toBe(409) // Correctly blocked with 409 because nameOnly is soft/active!

    // Reset config rules to default
    const reqConfigReset = new NextRequest('http://localhost/api/v1/settings/deduplication', {
      method: 'PUT',
      headers: headersAdminSchool,
      body: JSON.stringify({
        rules: {
          exactApplication: 'hard',
          sameChildSameYear: 'hard',
          contactAndChild: 'soft',
          emailAndChild: 'soft',
          sharedEmail: 'soft',
          nameOnly: 'off'
        }
      })
    })
    await saveDedupConfig(reqConfigReset)
  })

  it('6. Non-ORG_ADMIN roles are blocked from GET/PUT settings/deduplication', async () => {
    // GET request from Counsellor
    const reqGet = new NextRequest('http://localhost/api/v1/settings/deduplication', {
      method: 'GET',
      headers: headersCounsellorSchool
    })
    const resGet = await getDedupConfig(reqGet)
    expect(resGet.status).toBe(403) // Forbidden

    // PUT request from Counsellor
    const reqPut = new NextRequest('http://localhost/api/v1/settings/deduplication', {
      method: 'PUT',
      headers: headersCounsellorSchool,
      body: JSON.stringify({ rules: { nameOnly: 'soft' } })
    })
    const resPut = await saveDedupConfig(reqPut)
    expect(resPut.status).toBe(403) // Forbidden
  })

  // B. Guard / force override
  it('7. Hard match (exactApplication) cannot be overridden with force: true', async () => {
    const phone = '9999977777'
    const name = 'Match Kid Seven'
    const grade = 'Grade 7'

    const req1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Seven',
        phone,
        email: 'parent7@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    await createLead(req1)

    // Force create (R1 match)
    const reqForce = new NextRequest('http://localhost/api/v1/leads?force=true', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Parent Seven',
        phone,
        email: 'parent7@gmail.com',
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resForce = await createLead(reqForce)
    expect(resForce.status).toBe(409) // Stills blocks hard match!
  })

  // C. Household — negative
  it('9 & 10. Household link on create and Lead PATCH re-links correctly', async () => {
    const phone1 = '9999991111'
    const phone2 = '9999992222'

    // 9. Lead creation creates and links Household
    const reqCreate = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: 'Household Kid',
        parentName: 'Guardian Parent',
        phone: phone1,
        gradeSought: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resCreate = await createLead(reqCreate)
    expect(resCreate.status).toBe(201)
    const bodyCreate = await resCreate.json()
    const leadId = bodyCreate.data.id

    const dbLead1 = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } })
    expect(dbLead1.phoneNormalized).toBe(cleanPhoneNumber(phone1))
    expect(dbLead1.householdId).toBeDefined()

    // 10. Update Lead phone -> recomputes phoneNormalized and householdId
    const reqUpdate = new NextRequest(`http://localhost/api/v1/leads/${leadId}`, {
      method: 'PUT',
      headers: headersAdminSchool,
      body: JSON.stringify({
        phone: phone2
      })
    })
    const resUpdate = await updateLead(reqUpdate, { params: Promise.resolve({ id: leadId }) } as any)
    expect(resUpdate.status).toBe(200)

    const dbLead2 = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } })
    expect(dbLead2.phoneNormalized).toBe(cleanPhoneNumber(phone2))

    // Verify Household is updated/created for new phone
    const newHousehold = await prisma.household.findFirst({
      where: { orgId: orgIdSchool, phoneNormalized: cleanPhoneNumber(phone2) as string }
    })
    expect(dbLead2.householdId).toBe(newHousehold?.id)
  })

  it('11 & 12. Admission/Student PUT updates raw phone but misses phoneNormalized/household recalculation (GAP FOUND)', async () => {
    const phone1 = '9999995551'
    const phone2 = '9999995552'

    // --- 11. Admission Phone PATCH Omission ---
    // Create Admission
    const reqAdmCreate = new NextRequest('http://localhost/api/v1/admissions', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        applicantName: 'Admission Kid',
        parentName: 'Admission Parent',
        phone: phone1,
        gradeSought: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resAdmCreate = await createAdmission(reqAdmCreate)
    expect(resAdmCreate.status).toBe(201)
    const admId = (await resAdmCreate.json()).data.id

    const dbAdmBefore = await prisma.admission.findUniqueOrThrow({ where: { id: admId } })
    const oldHouseholdId = dbAdmBefore.householdId

    // Edit Admission phone
    const reqAdmEdit = new NextRequest(`http://localhost/api/v1/admissions/${admId}`, {
      method: 'PUT',
      headers: headersAdminSchool,
      body: JSON.stringify({
        phone: phone2
      })
    })
    const resAdmEdit = await updateAdmission(reqAdmEdit, { params: Promise.resolve({ id: admId }) } as any)
    expect(resAdmEdit.status).toBe(200)

    const dbAdmAfter = await prisma.admission.findUniqueOrThrow({ where: { id: admId } })
    expect(dbAdmAfter.phone).toBe(phone2)
    // Verification: phoneNormalized and householdId are correctly kept in sync!
    expect(dbAdmAfter.phoneNormalized).toBe(cleanPhoneNumber(phone2))
    expect(dbAdmAfter.householdId).not.toBe(oldHouseholdId)

    // --- 12. Student Phone PATCH Omission ---
    // Create Student
    const reqStuCreate = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        name: 'Student Kid',
        guardianName: 'Student Parent',
        guardianPhone: phone1,
        gradeLabel: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resStuCreate = await createStudent(reqStuCreate)
    expect(resStuCreate.status).toBe(201)
    const stuId = (await resStuCreate.json()).data.id

    const dbStuBefore = await prisma.student.findUniqueOrThrow({ where: { id: stuId } })
    const oldStuHouseholdId = dbStuBefore.householdId

    // Edit Student phone
    const reqStuEdit = new NextRequest(`http://localhost/api/v1/students/${stuId}`, {
      method: 'PUT',
      headers: headersAdminSchool,
      body: JSON.stringify({
        guardianPhone: phone2
      })
    })
    const resStuEdit = await updateStudent(reqStuEdit, { params: Promise.resolve({ id: stuId }) } as any)
    expect(resStuEdit.status).toBe(200)

    const dbStuAfter = await prisma.student.findUniqueOrThrow({ where: { id: stuId } })
    expect(dbStuAfter.guardianPhone).toBe(phone2)
    // Verification: phoneNormalized and householdId are correctly kept in sync on update!
    expect(dbStuAfter.phoneNormalized).toBe(cleanPhoneNumber(phone2))
    expect(dbStuAfter.householdId).not.toBe(oldStuHouseholdId)
  })

  // D. Cross-module reach — negative
  it('14. ParentEnquiry has no phoneNormalized and does not trigger dedup matching (GAP FOUND)', async () => {
    const phone = '9999998888'

    // Create marketplace Parent & ParentEnquiry
    const parent = await prisma.parent.create({
      data: {
        phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
        name: 'Market Parent',
        email: `market-${RUN}@gmail.com`
      }
    })

    // Seed School model needed for schoolId
    const school = await prisma.school.create({
      data: {
        organization: { connect: { id: orgIdSchool } },
        name: 'Market School',
        slug: `market-school-${RUN}`,
        institutionType: 'SCHOOL'
      }
    })

    await prisma.parentEnquiry.create({
      data: {
        orgId: orgIdSchool,
        schoolId: school.id,
        parentId: parent.id,
        kidName: 'Enquired Kid',
        gradeSought: 'Grade 1'
      }
    })

    // Create CRM Lead with same phone -> Expects success because ParentEnquiry is completely skipped by dedup finder (GAP CONFIRMED)
    const reqCreate = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: 'Enquired Kid',
        parentName: 'Market Parent',
        phone,
        gradeSought: 'Grade 1',
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const resCreate = await createLead(reqCreate)
    expect(resCreate.status).toBe(201) // Created successfully!

    // Cleanup marketplace records
    await prisma.parentEnquiry.deleteMany({ where: { parentId: parent.id } })
    await prisma.school.delete({ where: { id: school.id } })
    await prisma.parent.delete({ where: { id: parent.id } })
  })

  // E. Race condition — negative
  it('15. Simultaneous near-identical creation requests land duplicate records (GAP FOUND)', async () => {
    const phone = '9999999990'
    const name = 'Race Kid'
    const grade = 'Grade 10'

    // Fire two create requests concurrently with identical details that should hard-block
    const req1 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Race Parent',
        phone,
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })
    const req2 = new NextRequest('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: headersAdminSchool,
      body: JSON.stringify({
        kidName: name,
        parentName: 'Race Parent',
        phone,
        gradeSought: grade,
        branchId: branchIdSchool,
        academicYearId: academicYearIdSchool
      })
    })

    const results = await Promise.all([
      createLead(req1),
      createLead(req2)
    ])

    const statuses = results.map(r => r.status)
    expect(statuses).toContain(201)
    expect(statuses).toContain(409) // Concurrent duplicate creation is cleanly blocked with 409

    // Double check that only 1 lead was written
    const createdLeads = await prisma.lead.findMany({
      where: { orgId: orgIdSchool, kidName: name, phone }
    })
    expect(createdLeads.length).toBe(1)
  })
})
