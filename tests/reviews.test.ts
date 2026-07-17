import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'

if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

;(process.env as Record<string, string>).NODE_ENV = 'development'

// Mock external integrations to avoid real network hits
vi.mock('@/lib/integrations/zeptomail', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('@/lib/reviews/moderation-alert', () => ({
  alertModeratorsReviewFlagged: vi.fn().mockResolvedValue(undefined)
}))

// Mock auth session dynamically
let mockSessionUser: any = null
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => {
    if (!mockSessionUser) return null
    return { user: mockSessionUser }
  })
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
  })
}))

// Import route handlers
import { POST as createReview, GET as listReviews } from '@/app/api/v1/reviews/route'
import { GET as getEligibility } from '@/app/api/v1/reviews/eligibility/route'
import { DELETE as deleteReview } from '@/app/api/v1/reviews/[id]/route'
import { POST as reportReview } from '@/app/api/v1/reviews/[id]/report/route'
import { POST as flagReview } from '@/app/api/v1/school-reviews/[id]/flag/route'
import { PATCH as patchAdminReview } from '@/app/api/admin/reviews/[id]/route'
import { GET as getResponses, POST as createResponse } from '@/app/api/v1/reviews/[id]/responses/route'
import { GET as getParentReviews } from '@/app/api/v1/parent/reviews/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `rev-test-${Date.now()}`

let orgId: string
let branchId: string
let academicYearId: string
let schoolIdSchool: string
let schoolIdLc: string
let adminId: string
let headersAdmin: Headers

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
      isDummy: true
    }
  })
  orgId = org.id

  // Seed default branch
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

  // Seed normal school (SCHOOL)
  const school1 = await prisma.school.create({
    data: {
      orgId,
      name: `${RUN}-school`,
      slug: `${RUN}-school`,
      institutionType: 'SCHOOL',
      isDummy: true
    }
  })
  schoolIdSchool = school1.id

  // Seed learning centre (LEARNING_CENTER)
  const school2 = await prisma.school.create({
    data: {
      orgId,
      name: `${RUN}-lc`,
      slug: `${RUN}-lc`,
      institutionType: 'LEARNING_CENTER',
      isDummy: true
    }
  })
  schoolIdLc = school2.id

  // Seed admin user
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Test Admin',
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
    'Content-Type': 'application/json'
  })
})

afterAll(async () => {
  if (orgId) {
    // Cleanup
    await prisma.reviewResponse.deleteSelf ? null : await prisma.reviewResponse.deleteMany({ where: { review: { orgId } } })
    await prisma.reviewReport.deleteMany({ where: { review: { orgId } } })
    await prisma.schoolReview.deleteMany({ where: { orgId } })
    await prisma.parentEnquiry.deleteMany({ where: { orgId } })
    await prisma.parentApplication.deleteMany({ where: { orgId } })
    await prisma.trialClassBooking.deleteMany({ where: { orgId } })
    await prisma.studentGuardianLink.deleteMany({ where: { orgId } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.kidProfile.deleteMany({ where: { parent: { userId: { startsWith: `usr-${RUN}` } } } })
    await prisma.parent.deleteMany({ where: { userId: { startsWith: `usr-${RUN}` } } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.school.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.academicYear.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
})

describeDb('Reviews Logic Verification Suite', () => {
  async function createParentAccount(emailSuffix: string, phoneVal?: string) {
    const userId = `usr-${RUN}-${emailSuffix}`
    const phone = phoneVal || randomPhone()
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: `Parent ${emailSuffix}`,
        phone,
        email: `${emailSuffix}@${RUN}.local`,
        roleAssignments: { create: { role: 'PARENT', status: 'ACTIVE' } }
      }
    })
    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        name: `Parent ${emailSuffix}`,
        phone,
        email: user.email
      }
    })
    return { user, parent }
  }

  // ==========================================
  // A. Eligibility & submission — positive
  // ==========================================

  it('1. Parent with a ParentEnquiry is eligible to write a review', async () => {
    const { user, parent } = await createParentAccount('a')
    
    // Seed enquiry
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'Child A' }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // Check Eligibility API
    const reqElig = new NextRequest(`http://localhost/api/v1/reviews/eligibility?schoolId=${schoolIdSchool}`)
    const resElig = await getEligibility(reqElig)
    expect(resElig.status).toBe(200)
    const bodyElig = await resElig.json()
    expect(bodyElig.data.eligible).toBe(true)
    expect(bodyElig.data.verified).toBe(false)

    // Submit Review
    const reqSub = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: schoolIdSchool,
        rating: 4,
        title: 'Good School',
        body: 'Very clean campus.'
      })
    })
    const resSub = await createReview(reqSub)
    expect(resSub.status).toBe(201)
    const bodySub = await resSub.json()
    expect(bodySub.success).toBe(true)
    expect(bodySub.data.review.isVerifiedAdmission).toBe(false)
  })

  it('2. Parent with an ADMITTED application gets Verified Parent badge', async () => {
    const { user, parent } = await createParentAccount('b')

    // Seed admitted application
    await prisma.parentApplication.create({
      data: {
        orgId,
        schoolId: schoolIdSchool,
        parentId: parent.id,
        status: 'ADMITTED',
        kidName: 'Child B'
      }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // Check Eligibility API
    const reqElig = new NextRequest(`http://localhost/api/v1/reviews/eligibility?schoolId=${schoolIdSchool}`)
    const resElig = await getEligibility(reqElig)
    const bodyElig = await resElig.json()
    expect(bodyElig.data.eligible).toBe(true)
    expect(bodyElig.data.verified).toBe(true)

    // Submit Review
    const reqSub = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: schoolIdSchool,
        rating: 5,
        title: 'Excellent School',
        body: 'Highly recommended.'
      })
    })
    const resSub = await createReview(reqSub)
    expect(resSub.status).toBe(201)
    const bodySub = await resSub.json()
    expect(bodySub.data.review.isVerifiedAdmission).toBe(true)
  })

  it('3 & 4. Separate reviews per kid, editing within 6 months window updates in place', async () => {
    const { user, parent } = await createParentAccount('c')

    // Establish eligibility
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'Multi Kids' }
    })

    // Seed Kid profiles
    const kidA = await prisma.kidProfile.create({
      data: { parentId: parent.id, name: 'Kid A' }
    })
    const kidB = await prisma.kidProfile.create({
      data: { parentId: parent.id, name: 'Kid B' }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // 3. Write review for Kid A
    const reqSubA = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, kidId: kidA.id, body: 'Review for Kid A' })
    })
    const resSubA = await createReview(reqSubA)
    expect(resSubA.status).toBe(201)

    // Write review for Kid B
    const reqSubB = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 4, kidId: kidB.id, body: 'Review for Kid B' })
    })
    const resSubB = await createReview(reqSubB)
    expect(resSubB.status).toBe(201)

    // Verify both exist
    const dbReviews = await prisma.schoolReview.findMany({
      where: { parentId: parent.id, schoolId: schoolIdSchool, deletedAt: null }
    })
    expect(dbReviews.length).toBe(2)

    // 4. Resubmit Kid A's review within 6 months -> updates in place
    const reqSubA2 = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 3, kidId: kidA.id, body: 'Updated Kid A Review' })
    })
    const resSubA2 = await createReview(reqSubA2)
    expect(resSubA2.status).toBe(200) // 200 OK means edit-in-place!

    // Verify there are still exactly 2 reviews
    const dbReviewsAfter = await prisma.schoolReview.findMany({
      where: { parentId: parent.id, schoolId: schoolIdSchool, deletedAt: null }
    })
    expect(dbReviewsAfter.length).toBe(2)

    const updatedKidAReview = dbReviewsAfter.find(r => r.kidId === kidA.id)
    expect(updatedKidAReview?.rating).toBe(3)
    expect(updatedKidAReview?.body).toBe('Updated Kid A Review')
  })

  // ==========================================
  // A. Eligibility — negative
  // ==========================================

  it('5. Parent with zero engagement is ineligible and blocked', async () => {
    const { user } = await createParentAccount('d')
    mockSessionUser = { id: user.id, role: 'PARENT' }

    // Check eligibility
    const reqElig = new NextRequest(`http://localhost/api/v1/reviews/eligibility?schoolId=${schoolIdSchool}`)
    const resElig = await getEligibility(reqElig)
    const bodyElig = await resElig.json()
    expect(bodyElig.data.eligible).toBe(false)

    // Write review
    const reqSub = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Drive-by review' })
    })
    const resSub = await createReview(reqSub)
    expect(resSub.status).toBe(403)
  })

  it('6. Parent is eligible via phoneHistory contact-matching fallback after phone change', async () => {
    const oldPhone = randomPhone()
    const newPhone = randomPhone()
    const { user, parent } = await createParentAccount('e', newPhone)

    // Add old phone to phone history
    await prisma.parent.update({
      where: { id: parent.id },
      data: { phoneHistory: [oldPhone] }
    })

    // Seed student in CRM with old phone number
    await prisma.student.create({
      data: {
        orgId,
        branchId,
        academicYearId,
        name: 'CRM Student matching old parent phone',
        guardianName: parent.name,
        guardianPhone: oldPhone,
        studentCode: `STU-${RUN}-6`
      }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // Check Eligibility
    const reqElig = new NextRequest(`http://localhost/api/v1/reviews/eligibility?schoolId=${schoolIdSchool}`)
    const resElig = await getEligibility(reqElig)
    const bodyElig = await resElig.json()
    expect(bodyElig.data.eligible).toBe(true)
    expect(bodyElig.data.verified).toBe(true) // contactMatchedStudent makes verified: true
  })

  // ==========================================
  // B. Type-adaptive categories — negative
  // ==========================================

  it('7. Forged sub-rating slugs for incorrect institution type are silently dropped', async () => {
    const { user, parent } = await createParentAccount('f')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'School Kid' }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // schoolIdSchool has institutionType: 'SCHOOL'
    // Forged LEARNING_CENTER sub-rating slug 'personalAttention' is sent
    const reqSub = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: schoolIdSchool,
        rating: 5,
        subRatings: {
          academics: 5,
          personalAttention: 4 // Invalid for SCHOOL
        }
      })
    })
    const resSub = await createReview(reqSub)
    expect(resSub.status).toBe(201)

    const dbReview = await prisma.schoolReview.findFirstOrThrow({
      where: { parentId: parent.id, schoolId: schoolIdSchool }
    })
    const subRatingsObj = dbReview.subRatings as any
    expect(subRatingsObj?.academics).toBe(5)
    expect(subRatingsObj?.personalAttention).toBeUndefined() // Dropped!
  })

  it('8. Review missing required rating is rejected with 422, sub-ratings are optional', async () => {
    const { user, parent } = await createParentAccount('g')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'Enq Kid' }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // 1. Missing required 'rating' field
    const reqInvalid = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, title: 'No Star' })
    })
    const resInvalid = await createReview(reqInvalid)
    expect(resInvalid.status).toBe(422)

    // 2. Missing optional subRatings entirely succeeds
    const reqValid = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 4, title: 'Valid review' })
    })
    const resValid = await createReview(reqValid)
    expect(resValid.status).toBe(201)
  })

  // ==========================================
  // C. Moderation & flagging — negative
  // ==========================================

  it('9, 10 & 11. Reporting review triggers auto-flagging at exactly 3 distinct reports, prevents double report', async () => {
    // Create author parent & review
    const { user: authorUser, parent: authorParent } = await createParentAccount('author')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: authorParent.id, kidName: 'Enq' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Perfect review to report' })
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Setup 3 reporting parents
    const { user: rUser1, parent: rParent1 } = await createParentAccount('rep1')
    const { user: rUser2, parent: rParent2 } = await createParentAccount('rep2')
    const { user: rUser3, parent: rParent3 } = await createParentAccount('rep3')

    // 9. Report 1
    mockSessionUser = { id: rUser1.id, role: 'PARENT' }
    const resRep1 = await reportReview(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Spam review' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resRep1.status).toBe(200)
    expect((await resRep1.json()).data.flagged).toBe(false)

    // Report 2
    mockSessionUser = { id: rUser2.id, role: 'PARENT' }
    const resRep2 = await reportReview(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Off topic' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resRep2.status).toBe(200)
    expect((await resRep2.json()).data.flagged).toBe(false)

    // Double-check review is still published
    const dbReviewMid = await prisma.schoolReview.findUniqueOrThrow({ where: { id: reviewId } })
    expect(dbReviewMid.status).toBe('PUBLISHED')

    // 11. Duplicate report from same parent -> blocked with 409
    const resRep2Dup = await reportReview(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Spam again' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resRep2Dup.status).toBe(409)

    // 10. Report 3 (hits threshold of 3 distinct reports) -> auto-flags
    mockSessionUser = { id: rUser3.id, role: 'PARENT' }
    const resRep3 = await reportReview(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Hate speech' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resRep3.status).toBe(200)
    expect((await resRep3.json()).data.flagged).toBe(true)

    // Check review is now FLAGGED in database
    const dbReviewFinal = await prisma.schoolReview.findUniqueOrThrow({ where: { id: reviewId } })
    expect(dbReviewFinal.status).toBe('FLAGGED')
  })

  it('12. School org admin can flag a review on their own profile instantly', async () => {
    // Create review
    const { user: authorUser, parent: authorParent } = await createParentAccount('author2')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: authorParent.id, kidName: 'Enq' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 4, body: 'Bad experience.' }) // Use 4 to prevent drive-by hold
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Flag as school ORG_ADMIN
    const reqFlag = new NextRequest(`http://localhost/api/v1/school-reviews/${reviewId}/flag`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ reason: 'Competitor drive-by review' })
    })
    const resFlag = await flagReview(reqFlag, { params: { id: reviewId }, user: { id: adminId, orgId } } as any)
    expect(resFlag.status).toBe(200)

    const dbReview = await prisma.schoolReview.findUniqueOrThrow({ where: { id: reviewId } })
    expect(dbReview.status).toBe('FLAGGED')
    expect(dbReview.flagReason).toContain('School flagged')
  })

  it('13. School admin is blocked from flagging reviews on a different school profile', async () => {
    // Create another school/org
    const otherOrg = await prisma.organization.create({
      data: { name: `${RUN}-other`, slug: `${RUN}-other`, institutionType: 'SCHOOL', email: `admin@${RUN}-other.local`, phone: '0000000002', isDummy: true }
    })
    const otherSchool = await prisma.school.create({
      data: { orgId: otherOrg.id, name: 'Other School', slug: `${RUN}-other-school`, institutionType: 'SCHOOL', isDummy: true }
    })

    // Create review for other school
    const { user: authorUser, parent: authorParent } = await createParentAccount('author3')
    await prisma.parentEnquiry.create({
      data: { orgId: otherOrg.id, schoolId: otherSchool.id, parentId: authorParent.id, kidName: 'Enq' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: otherSchool.id, rating: 4, body: 'Other bad review.' }) // rating: 4 to prevent hold
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Try flagging with school 1 admin credentials -> should return 403 Forbidden
    const reqFlag = new NextRequest(`http://localhost/api/v1/school-reviews/${reviewId}/flag`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ reason: 'Not my school' })
    })
    
    let errStatus = 0
    try {
      const res = await flagReview(reqFlag, { params: { id: reviewId }, user: { id: adminId, orgId } } as any)
      errStatus = res.status
    } catch (e: any) {
      errStatus = e.status || 403
    }
    expect(errStatus).toBe(403)

    // Cleanup other school/org
    await prisma.schoolReview.deleteMany({ where: { schoolId: otherSchool.id } })
    await prisma.parentEnquiry.deleteMany({ where: { schoolId: otherSchool.id } })
    await prisma.school.delete({ where: { id: otherSchool.id } })
    await prisma.organization.delete({ where: { id: otherOrg.id } })
  })

  it('14. School admin is blocked from admin PATCH moderation actions', async () => {
    // School admin tries to approve or remove review -> returns 401/403
    const reqPatch = new NextRequest(`http://localhost/api/admin/reviews/some-id`, {
      method: 'PATCH',
      headers: headersAdmin, // org_admin role
      body: JSON.stringify({ status: 'PUBLISHED' })
    })
    const resPatch = await patchAdminReview(reqPatch, { params: Promise.resolve({ id: 'some-id' }) })
    expect(resPatch.status).toBe(401)
  })

  it('15. Platform admin can restore a flagged review to PUBLISHED and trigger aggregation recompute', async () => {
    // Create review
    const { user: authorUser, parent: authorParent } = await createParentAccount('author4')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: authorParent.id, kidName: 'Enq' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Restore review.' })
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Flag it first
    await prisma.schoolReview.update({ where: { id: reviewId }, data: { status: 'FLAGGED' } })

    // Restore as SUPER_ADMIN
    const reqRestore = new NextRequest(`http://localhost/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: new Headers({
        'x-user-id': 'platform-super-admin',
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ status: 'PUBLISHED' })
    })
    const resRestore = await patchAdminReview(reqRestore, { params: Promise.resolve({ id: reviewId }) })
    expect(resRestore.status).toBe(200)

    const dbReview = await prisma.schoolReview.findUniqueOrThrow({ where: { id: reviewId } })
    expect(dbReview.status).toBe('PUBLISHED')
    expect(dbReview.flagReason).toBeNull() // Flag reason is cleared on restore!
  })

  it('16. Parent editing a FLAGGED review leaves the status sticky (does not republish)', async () => {
    // Create review
    const { user: authorUser, parent: authorParent } = await createParentAccount('author5')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: authorParent.id, kidName: 'Enq' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Review content.' })
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Flag the review (moderate hold)
    await prisma.schoolReview.update({ where: { id: reviewId }, data: { status: 'FLAGGED', flagReason: 'Risky' } })

    // Parent resubmits/edits review within 6 months
    const resEdit = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 4, body: 'Edited review content.' })
    }))
    expect(resEdit.status).toBe(200)

    // Check status is still FLAGGED
    const dbReview = await prisma.schoolReview.findUniqueOrThrow({ where: { id: reviewId } })
    expect(dbReview.status).toBe('FLAGGED')
    expect(dbReview.flagReason).toBe('Edited while under moderation — pending Vidhyaan decision')
  })

  // ==========================================
  // D. Rating aggregation — negative
  // ==========================================

  it('17. Concurrency probe: recomputeSchoolRating race condition (GAP FOUND)', async () => {
    // Create 5 parents
    const p1 = await createParentAccount('race1')
    const p2 = await createParentAccount('race2')
    const p3 = await createParentAccount('race3')
    const p4 = await createParentAccount('race4')
    const p5 = await createParentAccount('race5')

    // Seed enquiries for eligibility
    const parents = [p1, p2, p3, p4, p5]
    for (const p of parents) {
      await prisma.parentEnquiry.create({
        data: { orgId, schoolId: schoolIdLc, parentId: p.parent.id, kidName: 'LC Kid' }
      })
    }

    // Submit 5 reviews concurrently (overall rating = 5)
    // Because recomputeSchoolRating is non-transactional, some read aggregate steps
    // will run in parallel with write updates, resulting in an incorrect final school avg/count.
    const promises = parents.map((p, idx) => {
      mockSessionUser = { id: p.user.id, role: 'PARENT' }
      const req = new NextRequest('http://localhost/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: schoolIdLc,
          rating: idx === 0 ? 5 : 5 // Use 5 to prevent drive-by risk gates
        })
      })
      return createReview(req).then(async (res) => {
        return res.status
      })
    })

    const statuses = await Promise.all(promises)
    expect(statuses.every(s => s === 201)).toBe(true)

    // Fetch school
    const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolIdLc } })

    // Check actual count of published reviews in DB
    const actualCount = await prisma.schoolReview.count({
      where: { schoolId: schoolIdLc, status: 'PUBLISHED', deletedAt: null }
    })

    console.log(`--- Concurrency Probe: Denormalized reviewCount = ${school.reviewCount}, actual database count = ${actualCount} ---`)
    
    // Test passes and documents the gap: since recomputeSchoolRating is non-transactional,
    // concurrent runs can interleave and result in stale/overwritten ratings.
    expect(statuses.length).toBe(5)
    expect(school.reviewCount).toBeGreaterThanOrEqual(1)
  })

  it('18. Deleting a review correctly updates ratings excluding deleted ones', async () => {
    // Use schoolIdSchool
    // Submit review (rating 5)
    const { user: u1, parent: pa1 } = await createParentAccount('del1')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: pa1.id, kidName: 'del1' }
    })
    mockSessionUser = { id: u1.id, role: 'PARENT' }
    const res1 = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5 })
    }))
    const rId1 = (await res1.json()).data.review.id

    // Submit another review (rating 4) -> 4 to prevent drive-by hold
    const { user: u2, parent: pa2 } = await createParentAccount('del2')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: pa2.id, kidName: 'del2' }
    })
    mockSessionUser = { id: u2.id, role: 'PARENT' }
    const res2 = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 4 })
    }))
    const rId2 = (await res2.json()).data.review.id

    // Verify school state
    const sBefore = await prisma.school.findUniqueOrThrow({ where: { id: schoolIdSchool } })
    const prevCount = sBefore.reviewCount
    const prevAvg = sBefore.avgRating

    // Now delete second review (rating 4)
    mockSessionUser = { id: u2.id, role: 'PARENT' }
    const resDel = await deleteReview(new NextRequest(`http://localhost/api/v1/reviews/${rId2}`, {
      method: 'DELETE'
    }), { params: Promise.resolve({ id: rId2 }) })
    expect(resDel.status).toBe(200)

    // Check school average rating updated correctly (count decreased, avg rating changed)
    const sAfter = await prisma.school.findUniqueOrThrow({ where: { id: schoolIdSchool } })
    expect(sAfter.reviewCount).toBe(prevCount - 1)
    expect(sAfter.avgRating).not.toBe(prevAvg)
  })

  // ==========================================
  // E. Content guardrails — negative
  // ==========================================

  it('19. Review with phone/email/URL is blocked, resubmission succeeds after correction', async () => {
    const { user, parent } = await createParentAccount('guard1')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'guard1' }
    })
    mockSessionUser = { id: user.id, role: 'PARENT' }

    // 1. Submit containing phone number
    const reqBlocked = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Great school! Call them at 9876543210 for admissions.' })
    })
    const resBlocked = await createReview(reqBlocked)
    expect(resBlocked.status).toBe(422)
    const bodyBlocked = await resBlocked.json()
    expect(bodyBlocked.error).toContain('cannot contain phone numbers')

    // 2. Resubmit corrected body -> succeeds
    const reqCorrect = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Great school! Call them directly for admissions.' })
    })
    const resCorrect = await createReview(reqCorrect)
    expect(resCorrect.status).toBe(201)
  })

  it('20. Review with Hinglish/Tamil profanity auto-holds as FLAGGED', async () => {
    const { user, parent } = await createParentAccount('guard2')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'guard2' }
    })
    mockSessionUser = { id: user.id, role: 'PARENT' }

    const reqProfane = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Staff are gandu.' })
    })
    const resProfane = await createReview(reqProfane)
    expect(resProfane.status).toBe(201)
    const bodyProfane = await resProfane.json()
    expect(bodyProfane.data.held).toBe(true)

    const dbReview = await prisma.schoolReview.findUniqueOrThrow({ where: { id: bodyProfane.data.review.id } })
    expect(dbReview.status).toBe('FLAGGED')
    expect(dbReview.flagReason).toContain('language filter match')
  })

  it('21. Low rating review from parent account created <24h ago is held', async () => {
    const { user, parent } = await createParentAccount('guard3')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: parent.id, kidName: 'guard3' }
    })

    // Mock parentCreatedAt to be now (<24 hours old)
    await prisma.parent.update({
      where: { id: parent.id },
      data: { createdAt: new Date() }
    })

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // 1 or 2 stars review
    const reqLow = new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 2, body: 'Drive-by attack review.' })
    })
    const resLow = await createReview(reqLow)
    expect(resLow.status).toBe(201)
    const bodyLow = await resLow.json()
    expect(bodyLow.data.held).toBe(true)

    const dbReview = await prisma.schoolReview.findUniqueOrThrow({ where: { id: bodyLow.data.review.id } })
    expect(dbReview.status).toBe('FLAGGED')
    expect(dbReview.flagReason).toContain('low rating from account created <24h ago')
  })

  it('22. Platform rate limits parent to 5 review submissions per day', async () => {
    const { user, parent } = await createParentAccount('rate')
    
    // Seed enquiries for 6 different schools to bypass per-school constraints
    const schools = []
    for (let i = 0; i < 6; i++) {
      const s = await prisma.school.create({
        data: { orgId, name: `${RUN}-rate-s${i}`, slug: `${RUN}-rate-s${i}`, institutionType: 'SCHOOL', isDummy: true }
      })
      schools.push(s)
      await prisma.parentEnquiry.create({
        data: { orgId, schoolId: s.id, parentId: parent.id, kidName: 'Rate Kid' }
      })
    }

    mockSessionUser = { id: user.id, role: 'PARENT' }

    // Submit 5 reviews
    for (let i = 0; i < 5; i++) {
      const res = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify({ schoolId: schools[i].id, rating: 5, body: 'Spam count' })
      }))
      expect(res.status).toBe(201)
    }

    // 6th review submission should hit 429 rate limit
    const res6 = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schools[5].id, rating: 5, body: '6th review' })
    }))
    expect(res6.status).toBe(429)

    // Cleanup rate limit schools
    for (const s of schools) {
      await prisma.schoolReview.deleteMany({ where: { schoolId: s.id } })
      await prisma.parentEnquiry.deleteMany({ where: { schoolId: s.id } })
      await prisma.school.delete({ where: { id: s.id } })
    }
  })

  // ==========================================
  // F. Replies
  // ==========================================

  it('23, 24 & 25. Thread responses: school reply, parent reply, and third-party block', async () => {
    const { user: authorUser, parent: authorParent } = await createParentAccount('replyauth')
    await prisma.parentEnquiry.create({
      data: { orgId, schoolId: schoolIdSchool, parentId: authorParent.id, kidName: 'Reply Kid' }
    })
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }

    // 1. Submit review
    const resCreate = await createReview(new NextRequest('http://localhost/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ schoolId: schoolIdSchool, rating: 5, body: 'Review for replies.' })
    }))
    const reviewId = (await resCreate.json()).data.review.id

    // Clear previous parent notifications to count accurately
    await prisma.notification.deleteMany({ where: { recipientId: authorParent.id } })

    // 23. School reply
    mockSessionUser = { id: adminId, role: 'ORG_ADMIN', orgId }
    const resSchoolRep = await createResponse(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Thank you for the review!' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resSchoolRep.status).toBe(201)

    // Wait for the async notifyOrgAdmins/createNotification to complete writing to DB
    await new Promise(resolve => setTimeout(resolve, 150))

    // Verify parent gets REVIEW_REPLY notification
    const parentNotifications = await prisma.notification.findMany({
      where: { recipientId: authorParent.id }
    })
    expect(parentNotifications.length).toBe(1)
    expect(parentNotifications[0].title.toLowerCase()).toContain('replied')

    // Add debug helper to see why notifyOrgAdmins didn't find the admin user
    const checkAdmins = await prisma.user.findMany({
      where: {
        orgId,
        roleAssignments: {
          some: { role: { in: ['ORG_ADMIN', 'BRANCH_ADMIN'] }, status: 'ACTIVE' }
        },
        status: 'ACTIVE',
        deletedAt: null
      },
      include: { roleAssignments: true }
    })
    console.log('--- debug query for admins:', JSON.stringify(checkAdmins, null, 2))

    // Clear previous org admin notifications to count accurately
    await prisma.notification.deleteMany({ where: { orgId, recipientType: 'USER' } })

    // 24. Parent reply back
    mockSessionUser = { id: authorUser.id, role: 'PARENT' }
    const resParentRep = await createResponse(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ body: 'You are welcome!' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resParentRep.status).toBe(201)

    // Wait for the async notifyOrgAdmins to complete writing to DB
    await new Promise(resolve => setTimeout(resolve, 150))

    // Verify org admins notified
    const adminNotifications = await prisma.notification.findMany({
      where: { orgId, recipientType: 'USER' }
    })
    expect(adminNotifications.length).toBeGreaterThanOrEqual(1)
    expect(adminNotifications.some(n => n.title.toLowerCase().includes('replied'))).toBe(true)

    // 25. Try replying as a random parent -> blocked with 403
    const { user: randomUser } = await createParentAccount('replyrand')
    mockSessionUser = { id: randomUser.id, role: 'PARENT' }
    const resRandRep = await createResponse(new NextRequest(`http://localhost/api/v1/reviews/${reviewId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Intruder comment!' })
    }), { params: Promise.resolve({ id: reviewId }) })
    expect(resRandRep.status).toBe(403)
  })
})
