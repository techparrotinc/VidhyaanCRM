import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'
import { SubscriptionStatus, OrgStatus, TransactionStatus, TransactionType } from '@prisma/client'
import crypto from 'crypto'

// Force NODE_ENV to development for Razorpay mock support (readonly in
// Next.js's ProcessEnv typing — cast to write it from a test)
;(process.env as Record<string, string>).NODE_ENV = 'development'
process.env.RAZORPAY_KEY_ID = 'mock_key'
process.env.RAZORPAY_KEY_SECRET = 'mock_secret'
process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret'

// Import handlers
import { POST as subscribePlan } from '@/app/api/v1/billing/subscribe/route'
import { POST as verifyPlan } from '@/app/api/v1/billing/verify/route'
import { POST as razorpayWebhook } from '@/app/api/webhooks/razorpay/route'
import { POST as createStudent } from '@/app/api/v1/students/route'
import { POST as bulkImportStudents } from '@/app/api/v1/students/bulk-import/route'
import { POST as convertAdmission } from '@/app/api/v1/admissions/[id]/convert/route'
import { POST as inviteUser } from '@/app/api/v1/users/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `bill-test-${Date.now()}`

let orgId: string
let adminId: string
let branchId: string
let freePlanId: string
let starterPlanId: string
let headersAdmin: Headers
let adminSessionMock: any

beforeAll(async () => {
  // Seed modules needed
  const modules = ['student_management', 'admission_management', 'fee_management']
  for (const slug of modules) {
    await prisma.module.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug, description: slug }
    })
  }

  // Seed plans
  const fp = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free Plan',
      slug: 'free',
      description: 'Free Plan',
      monthlyPrice: 0,
      leadCap: 10,
      isActive: true,
      isPublic: true,
      sortOrder: 1
    }
  })
  freePlanId = fp.id

  const sp = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter Plan',
      slug: 'starter',
      description: 'Starter Plan',
      monthlyPrice: 999,
      leadCap: 100,
      isActive: true,
      isPublic: true,
      sortOrder: 2
    }
  })
  starterPlanId = sp.id

  // Seed plan prices (slabs) for starter plan
  const slabs = ['S50', 'S100', 'S200', 'S500', 'S500_PLUS'] as const
  for (const slab of slabs) {
    await prisma.planPrice.upsert({
      where: { planId_slab: { planId: starterPlanId, slab } },
      update: {},
      create: {
        planId: starterPlanId,
        slab,
        monthlyPrice: slab === 'S50' ? 999 : slab === 'S100' ? 1499 : 1999,
        annualPrice: slab === 'S50' ? 9990 : slab === 'S100' ? 14990 : 19990,
        bundledAiCredits: 100
      }
    })
  }

  // Seed platform settings for webhook secret
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: { razorpayWebhookSecret: 'mock_webhook_secret' },
    create: { id: 'default', razorpayWebhookSecret: 'mock_webhook_secret' }
  })

  // Seed Organization
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}.local`,
      phone: '0000000000',
      isDummy: true,
      planId: freePlanId,
      status: 'ACTIVE'
    }
  })
  orgId = org.id

  // Seed organization module enablements
  for (const slug of modules) {
    const m = await prisma.module.findUniqueOrThrow({ where: { slug } })
    await prisma.organizationModule.create({
      data: { orgId, moduleId: m.id, enabled: true }
    })
  }

  // Seed default branch
  const br = await prisma.branch.create({
    data: { orgId, name: `${RUN}-default`, isDefault: true }
  })
  branchId = br.id

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

  adminSessionMock = {
    user: {
      id: adminId,
      role: 'ORG_ADMIN',
      orgId
    }
  }

  // Mock NextAuth authentication call
  vi.mock('@/auth', () => ({
    auth: vi.fn(() => Promise.resolve(adminSessionMock))
  }))
})

afterAll(async () => {
  if (orgId) {
    await prisma.payment.deleteMany({ where: { orgId } })
    await prisma.invoiceItem.deleteMany({ where: { orgId } })
    await prisma.invoice.deleteMany({ where: { orgId } })
    await prisma.transaction.deleteMany({ where: { orgId } })
    await prisma.subscription.deleteMany({ where: { orgId } })
    await prisma.couponRedemption.deleteMany({ where: { orgId } })
    await prisma.studentActivity.deleteMany({ where: { student: { orgId } } })
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.admissionActivity.deleteMany({ where: { orgId } })
    await prisma.admission.deleteMany({ where: { orgId } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.branch.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describeDb('Billing and Subscription Verification Suite', () => {
  // A. Checkout / order creation — positive
  it('1. Upgrade from free to starter at detected slab matches getEffectivePricing server-side price', async () => {
    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY'
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.orderId).toBeDefined()
    expect(body.amount).toBe(117882) // ₹999.00 * 1.18 = ₹1178.82 in paise (detected slab is S50)
  })

  it('2. Apply valid coupon records server-side discount', async () => {
    const couponCode = `SAVE50_${RUN}`.toUpperCase()
    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        percentOff: 50,
        isActive: true
      }
    })

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        couponCode: couponCode
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.amount).toBe(58941) // 50% off ₹999 = ₹499.50 * 1.18 = ₹589.41 in paise (58941 paise)

    await prisma.coupon.delete({ where: { id: coupon.id } })
  })

  it('3. Full downgrade where proration credit >= price routes to pendingPlanChange scheduling path instead of Razorpay', async () => {
    // Create an active paid subscription
    const sub = await prisma.subscription.create({
      data: {
        orgId,
        planId: starterPlanId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'ANNUAL',
        amount: 9990,
        startedAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000) // 30 days left
      }
    })

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'free',
        billingCycle: 'MONTHLY'
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.downgradeScheduled).toBe(true)
    expect(body.effectiveAt).toBeDefined()

    // Verify organization settings has pendingPlanChange scheduled
    const dbOrg = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    const settings = dbOrg.settings as any
    expect(settings.pendingPlanChange).toBeDefined()
    expect(settings.pendingPlanChange.planSlug).toBe('free')

    // Cleanup subscription
    await prisma.subscription.delete({ where: { id: sub.id } })
    await prisma.organization.update({ where: { id: orgId }, data: { settings: {} } })
  })

  // A. Checkout — negative
  it('4. Select a slab below actual student count silently forces slab up to detected one', async () => {
    // Create 60 students in DB to push org into S100 slab
    for (let i = 0; i < 60; i++) {
      await prisma.student.create({
        data: {
          orgId,
          studentCode: `STU-SLAB-${i}`,
          name: `Slab Kid ${i}`,
          status: 'ACTIVE'
        }
      })
    }

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        slab: 'S50' // Underbuying! actual is S100
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    // S100 slab price is 1499 * 1.18 = 1768.82. Silently forced up!
    expect(body.amount).toBe(176882)

    // Cleanup students
    await prisma.student.deleteMany({ where: { orgId } })
  })

  it('5. Expired coupon gets rejected server-side', async () => {
    const expiredCoupon = await prisma.coupon.create({
      data: {
        code: 'EXPIRED_CODE',
        percentOff: 10,
        expiresAt: new Date(Date.now() - 3600 * 1000), // expired 1 hour ago
        isActive: true
      }
    })

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        couponCode: 'EXPIRED_CODE'
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('This coupon has expired')

    await prisma.coupon.delete({ where: { id: expiredCoupon.id } })
  })

  it('6. Coupon at maxRedemptions limit gets rejected', async () => {
    const limitedCoupon = await prisma.coupon.create({
      data: {
        code: 'MAXED',
        percentOff: 10,
        maxRedemptions: 1,
        isActive: true
      }
    })

    // Simulate redemption
    await prisma.couponRedemption.create({
      data: {
        couponId: limitedCoupon.id,
        orgId: 'other-org-id'
      }
    })

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        couponCode: 'MAXED'
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('This coupon has been fully redeemed')

    await prisma.couponRedemption.deleteMany({ where: { couponId: limitedCoupon.id } })
    await prisma.coupon.delete({ where: { id: limitedCoupon.id } })
  })

  it('7. Reusing same coupon for same org is blocked', async () => {
    const singleCoupon = await prisma.coupon.create({
      data: {
        code: 'ONCE',
        percentOff: 10,
        isActive: true
      }
    })

    // Record one redemption for our test orgId
    await prisma.couponRedemption.create({
      data: {
        couponId: singleCoupon.id,
        orgId
      }
    })

    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        couponCode: 'ONCE'
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Your institution has already used this coupon')

    await prisma.couponRedemption.deleteMany({ where: { couponId: singleCoupon.id } })
    await prisma.coupon.delete({ where: { id: singleCoupon.id } })
  })

  it('8. Tampered amount / price bypassed because it is not accepted in request schema', async () => {
    // Make sure no students are left from other tests that might change the slab
    await prisma.student.deleteMany({ where: { orgId } })

    // Schema parser only accepts: planSlug, billingCycle, slab, gstin, couponCode.
    // Try sending amountInPaise: 100 directly.
    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        amountInPaise: 100 // tampered
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.amount).toBe(117882) // Server computed price + 18% GST is used, tampered input is ignored!
  })

  it('9. Submit invalid GSTIN gets rejected by schema regex', async () => {
    const req = new NextRequest('http://localhost/api/v1/billing/subscribe', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        planSlug: 'starter',
        billingCycle: 'MONTHLY',
        gstin: '12345ABCDE' // Invalid format
      })
    })
    const res = await subscribePlan(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid parameters')
  })

  // B. Webhook handling — negative
  it('10. Webhook payment.failed leaves gatewayRef unchanged, failedPaymentId lands in metadata', async () => {
    // Setup pending transaction
    const orderId = 'order_test_failed_webhook'
    const transaction = await prisma.transaction.create({
      data: {
        orgId,
        type: TransactionType.SUBSCRIPTION,
        status: 'PENDING',
        amount: 999,
        currency: 'INR',
        gatewayRef: orderId
      }
    })

    const payload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_failed_xyz',
            order_id: orderId,
            amount: 99900
          }
        }
      }
    }

    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }),
      body: rawBody
    })

    const res = await razorpayWebhook(req)
    expect(res.status).toBe(200)

    const updatedTx = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(updatedTx.status).toBe('FAILED')
    expect(updatedTx.gatewayRef).toBe(orderId) // Remains as order_id!
    const metadata = updatedTx.metadata as any
    expect(metadata.failedPaymentId).toBe('pay_failed_xyz')

    await prisma.transaction.delete({ where: { id: transaction.id } })
  })

  it('11. Webhook with invalid signature returns HTTP 200 but performs NO state mutations', async () => {
    // Setup pending transaction
    const orderId = 'order_test_sig_mismatch'
    const transaction = await prisma.transaction.create({
      data: {
        orgId,
        type: TransactionType.SUBSCRIPTION,
        status: 'PENDING',
        amount: 999,
        currency: 'INR',
        gatewayRef: orderId
      }
    })

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_sig_xyz',
            order_id: orderId
          }
        }
      }
    }

    const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({
        'x-razorpay-signature': 'wrong_signature_hex_value',
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    const res = await razorpayWebhook(req)
    expect(res.status).toBe(200) // Returns 200 to satisfy webhook provider
    const body = await res.json()
    expect(body.message).toBe('Signature mismatch')

    // Verify transaction remains PENDING in DB (no mutation occurred)
    const dbTx = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(dbTx.status).toBe('PENDING')

    await prisma.transaction.delete({ where: { id: transaction.id } })
  })

  it('12. Webhook payment.captured is idempotent (duplicate delivery)', async () => {
    // Setup subscription & transaction
    const orderId = 'order_test_idempotency'
    const transaction = await prisma.transaction.create({
      data: {
        orgId,
        type: TransactionType.SUBSCRIPTION,
        status: 'PENDING',
        amount: 999,
        currency: 'INR',
        gatewayRef: orderId
      }
    })

    const subscription = await prisma.subscription.create({
      data: {
        orgId,
        planId: starterPlanId,
        status: SubscriptionStatus.PAST_DUE,
        billingCycle: 'MONTHLY',
        amount: 999
      }
    })

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_idemp_xyz',
            order_id: orderId
          }
        }
      }
    }

    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    // First delivery
    const req1 = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })
    const res1 = await razorpayWebhook(req1)
    expect(res1.status).toBe(200)

    const tx1 = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(tx1.status).toBe('SUCCESS')

    const sub1 = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } })
    expect(sub1.status).toBe(SubscriptionStatus.ACTIVE)

    // Second delivery (duplicate)
    const req2 = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })
    const res2 = await razorpayWebhook(req2)
    expect(res2.status).toBe(200)

    // Verify remains active, no issues
    const sub2 = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } })
    expect(sub2.status).toBe(SubscriptionStatus.ACTIVE)

    await prisma.transaction.delete({ where: { id: transaction.id } })
    await prisma.subscription.delete({ where: { id: subscription.id } })
  })

  it('13. Webhook subscription.halted sets org PAST_DUE and subscription EXPIRED immediately', async () => {
    const sub = await prisma.subscription.create({
      data: {
        orgId,
        planId: starterPlanId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'MONTHLY',
        amount: 999,
        gatewaySubId: 'sub_test_halted_id'
      }
    })

    const payload = {
      event: 'subscription.halted',
      payload: {
        subscription: {
          entity: {
            id: 'sub_test_halted_id'
          }
        }
      }
    }

    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })

    const res = await razorpayWebhook(req)
    expect(res.status).toBe(200)

    const dbSub = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } })
    expect(dbSub.status).toBe(SubscriptionStatus.EXPIRED)

    const dbOrg = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(dbOrg.status).toBe(OrgStatus.PAST_DUE)

    await prisma.subscription.delete({ where: { id: sub.id } })
    await prisma.organization.update({ where: { id: orgId }, data: { status: OrgStatus.ACTIVE } })
  })

  // C. Free-tier limit — negative
  it('14 & 15 & 16. Free-tier limit check bypasses (Normal create vs Bulk Import vs Convert Admission)', async () => {
    // 14. Normal single student create past 25 should be blocked
    // Create 25 students first
    const studentsCreated = []
    for (let i = 0; i < 25; i++) {
      const s = await prisma.student.create({
        data: {
          orgId,
          studentCode: `STU-FREE-CAP-${i}`,
          name: `Free Cap Kid ${i}`,
          status: 'ACTIVE'
        }
      })
      studentsCreated.push(s)
    }

    // Try to create 26th student via normal create POST
    const reqSingle = new NextRequest('http://localhost/api/v1/students', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Kid #26' })
    })
    const resSingle = await createStudent(reqSingle)
    expect(resSingle.status).toBe(403) // Blocked!

    // 15. Create student #26+ via bulk-import (Expects success: GAP FOUND!)
    const reqBulk = new NextRequest('http://localhost/api/v1/students/bulk-import', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        students: [
          { name: 'Bulk Cap Kid 1' },
          { name: 'Bulk Cap Kid 2' }
        ],
        force: true
      })
    })
    const resBulk = await bulkImportStudents(reqBulk)
    expect(resBulk.status).toBe(201) // Successfully created despite cap! (Vitest/compose compose formats success response status 201)

    // 16. Convert Admission past 25 (Expects success: GAP FOUND!)
    // Seed ADMITTED admission stage
    const wonStage = await prisma.admissionStage.create({
      data: { orgId, name: 'Won', sortOrder: 1, isWon: true, isLost: false }
    })
    const admission = await prisma.admission.create({
      data: {
        orgId,
        admissionCode: `ADM-${RUN}-${Date.now()}`,
        applicantName: 'Admission Cap Kid',
        status: 'ADMITTED',
        stageId: wonStage.id
      }
    })

    const reqConvert = new NextRequest(`http://localhost/api/v1/admissions/${admission.id}/convert`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({})
    })
    const resConvert = await convertAdmission(reqConvert, { params: Promise.resolve({ id: admission.id }) } as any)
    expect(resConvert.status).toBe(403) // Correctly blocked by free-tier limit check!

    // Clean up
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.admission.delete({ where: { id: admission.id } })
    await prisma.admissionStage.delete({ where: { id: wonStage.id } })
  })

  it('17. Invite user #3 on free tier is blocked', async () => {
    // Seed 2 active users (admin user already exists, create second)
    const user2 = await prisma.user.create({
      data: {
        orgId,
        name: 'User 2',
        email: `u2@${RUN}.local`,
        phone: '99999' + Math.floor(10000 + Math.random() * 90000),
        status: 'ACTIVE'
      }
    })

    // Try to invite 3rd user
    const reqInvite = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        name: 'User 3',
        phone: '9999900003',
        email: `u3@${RUN}.local`,
        role: 'TEACHER'
      })
    })
    const resInvite = await inviteUser(reqInvite)
    expect(resInvite.status).toBe(403) // Blocked!

    await prisma.user.delete({ where: { id: user2.id } })
  })

  // E. Refunds & discounts
  it('21. Webhook refund.processed updates transaction status to REFUNDED, org plan is NOT auto-deactivated', async () => {
    const sub = await prisma.subscription.create({
      data: {
        orgId,
        planId: starterPlanId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'MONTHLY',
        amount: 999
      }
    })

    const transaction = await prisma.transaction.create({
      data: {
        orgId,
        subscriptionId: sub.id,
        type: TransactionType.SUBSCRIPTION,
        status: TransactionStatus.SUCCESS,
        amount: 999,
        currency: 'INR',
        gatewayRef: 'pay_refund_test_xyz'
      }
    })

    const payload = {
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_test_123',
            payment_id: 'pay_refund_test_xyz',
            amount: 99900
          }
        }
      }
    }

    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })

    const res = await razorpayWebhook(req)
    expect(res.status).toBe(200)

    const dbTx = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(dbTx.status).toBe(TransactionStatus.REFUNDED)

    // Verify subscription status is still ACTIVE (no auto-deactivation)
    const dbSub = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } })
    expect(dbSub.status).toBe(SubscriptionStatus.ACTIVE)

    await prisma.transaction.delete({ where: { id: transaction.id } })
    await prisma.subscription.delete({ where: { id: sub.id } })
  })
})
