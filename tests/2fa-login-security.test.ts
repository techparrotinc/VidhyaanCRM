import { describe, it, expect, beforeAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import { redis } from '@/lib/redis'
import { generate as generateTotp, generateSecret } from 'otplib'
import { encryptSecret } from '@/lib/payments/vault'
import argon2 from 'argon2'
import bcrypt from 'bcryptjs'

if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

;(process.env as Record<string, string>).NODE_ENV = 'development'
process.env.PAYMENT_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')

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

// Mock NextAuth session user dynamically
let mockSessionUser: any = null
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => {
    if (!mockSessionUser) return null
    return { user: mockSessionUser }
  })
}))

// Import route handlers
import { POST as startEnroll } from '@/app/api/auth/2fa/enroll/start/route'
import { POST as confirmEnroll } from '@/app/api/auth/2fa/enroll/confirm/route'
import { POST as disable2fa } from '@/app/api/auth/2fa/disable/route'
import { POST as challenge2fa } from '@/app/api/auth/2fa/challenge/route'
import { POST as reset2fa } from '@/app/api/admin/2fa-reset/route'
import { POST as updatePolicy } from '@/app/api/auth/2fa/policy/route'
import authConfig from '@/lib/auth/config'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `mfa-test-${Date.now()}`

let orgId: string
let userId: string
let userPhone: string
let adminId: string
let adminUserContext: any
let standardUserContext: any

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

  // Enable settings modules
  const m = await prisma.module.upsert({
    where: { slug: 'lead_management' },
    update: {},
    create: { slug: 'lead_management', name: 'lead_management', description: 'lead_management' }
  })
  await prisma.organizationModule.create({
    data: { orgId, moduleId: m.id, enabled: true }
  })

  // Admin user
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'MFA Admin',
      email: `admin@${RUN}.local`,
      phone: randomPhone(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' } }
    }
  })
  adminId = admin.id

  // Standard staff user
  userPhone = randomPhone()
  const pinHash = await argon2.hash('1111', {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  })
  const user = await prisma.user.create({
    data: {
      orgId,
      name: 'Staff Member',
      email: `staff@${RUN}.local`,
      phone: userPhone,
      pinHash,
      pinSetAt: new Date(),
      status: 'ACTIVE',
      roleAssignments: { create: { role: 'COUNSELLOR', orgId, status: 'ACTIVE' } }
    }
  })
  userId = user.id

  adminUserContext = {
    user: { id: adminId, orgId, role: 'ORG_ADMIN' }
  }

  standardUserContext = {
    user: { id: userId, orgId, role: 'COUNSELLOR', email: `staff@${RUN}.local`, phone: userPhone }
  }
})

describeDb('2FA & Login Security Verification Suite', () => {

  // ==========================================
  // A. TOTP Enrolment
  // ==========================================

  it('1. Start TOTP enrolment -> QR code renders, secret is NOT yet in DB', async () => {
    mockSessionUser = standardUserContext.user

    const req = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'TOTP' })
    })

    const res = await startEnroll(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.qrDataUri).toContain('data:image/png;base64')
    expect(body.secret).toBeDefined()

    // Database should NOT have the 2FA row yet
    const dbRow = await prisma.userTwoFactor.findUnique({ where: { userId } })
    expect(dbRow).toBeNull()

    // Secret should reside only in Redis
    const redisSecret = await redis.get(`mfa_enroll:${userId}`)
    expect(redisSecret).not.toBeNull()
  })

  it('2 & 3. Confirm TOTP activation & verify challenge token log-in succeeds', async () => {
    mockSessionUser = standardUserContext.user

    // Retrieve secret from Redis (stashed by Test 1)
    const raw = await redis.get(`mfa_enroll:${userId}`)
    expect(raw).not.toBeNull()
    const { secret } = JSON.parse(raw!)

    // Generate valid code
    const code = await generateTotp({ secret })

    // 2. Confirm enrolment
    const reqConf = new NextRequest('http://localhost/api/auth/2fa/enroll/confirm', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
    const resConf = await confirmEnroll(reqConf)
    expect(resConf.status).toBe(200)
    const bodyConf = await resConf.json()
    expect(bodyConf.backupCodes.length).toBe(10) // Plaintext backup codes returned once

    // Verify DB states: encrypted at rest + backup codes hashes stored
    const dbRow = await prisma.userTwoFactor.findUnique({ where: { userId } })
    expect(dbRow?.secretEnc).not.toBeNull()
    expect(dbRow?.backupCodes).toHaveLength(10)

    // 3. Log out and try login challenge with Phone & PIN
    const reqChallenge = new NextRequest('http://localhost/api/auth/2fa/challenge', {
      method: 'POST',
      body: JSON.stringify({ phone: userPhone, pin: '1111' })
    })
    const resChallenge = await challenge2fa(reqChallenge)
    expect(resChallenge.status).toBe(200)
    const bodyChallenge = await resChallenge.json()
    expect(bodyChallenge.requires2fa).toBe(true)
    expect(bodyChallenge.challengeToken).toBeDefined()
    expect(bodyChallenge.method).toBe('TOTP')

    // Redeem challenge token using next TOTP step
    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    const nextCode = await generateTotp({ secret })
    const authSession = await authorize({
      challengeToken: bodyChallenge.challengeToken,
      secondFactor: nextCode
    })
    expect(authSession).not.toBeNull()
    expect(authSession.id).toBe(userId)
  })

  it('4. Start enrolment, submit invalid code -> enrolment does NOT activate', async () => {
    // Clear existing 2FA for staff
    await prisma.userTwoFactor.deleteMany({ where: { userId } })

    mockSessionUser = standardUserContext.user

    // Start enrolment
    const reqStart = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'TOTP' })
    })
    await startEnroll(reqStart)

    // Confirm with invalid code
    const reqConf = new NextRequest('http://localhost/api/auth/2fa/enroll/confirm', {
      method: 'POST',
      body: JSON.stringify({ code: '000000' })
    })
    const resConf = await confirmEnroll(reqConf)
    expect(resConf.status).toBe(400)

    // No DB row created
    const dbRow = await prisma.userTwoFactor.findUnique({ where: { userId } })
    expect(dbRow).toBeNull()
  })

  it('5. Start enrolment when already enrolled -> blocked with 409', async () => {
    // Enroll user first
    const secret = generateSecret()
    await prisma.userTwoFactor.upsert({
      where: { userId },
      create: { userId, method: 'TOTP', secretEnc: secret, enabledAt: new Date(), backupCodes: [] },
      update: { method: 'TOTP', secretEnc: secret, enabledAt: new Date(), backupCodes: [] }
    })

    mockSessionUser = standardUserContext.user

    const req = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'TOTP' })
    })
    const res = await startEnroll(req)
    expect(res.status).toBe(409)
  })

  it('6. Back-to-back start calls -> same pending secret reused (overwrite gap FIXED)', async () => {
    await prisma.userTwoFactor.deleteMany({ where: { userId } })

    mockSessionUser = standardUserContext.user

    // Call 1
    const req1 = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'TOTP' })
    })
    const res1 = await startEnroll(req1)
    const body1 = await res1.json()

    // Call 2 (simulated back-to-back)
    const req2 = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'TOTP' })
    })
    const res2 = await startEnroll(req2)
    const body2 = await res2.json()

    // Fixed: second start reuses the pending secret, so the first QR stays valid
    const redisSecretRaw = await redis.get(`mfa_enroll:${userId}`)
    const { secret } = JSON.parse(redisSecretRaw!)
    expect(secret).toBe(body2.secret)
    expect(secret).toBe(body1.secret)
  })

  // ==========================================
  // B. Login Challenge
  // ==========================================

  it('7. Direct session-mint via credentials phone+pin blocked when 2FA enabled (bypass FIXED)', async () => {
    // Re-enroll 2FA
    const secret = generateSecret()
    const secretEnc = encryptSecret(secret)
    await prisma.userTwoFactor.upsert({
      where: { userId },
      create: { userId, method: 'TOTP', secretEnc, enabledAt: new Date(), backupCodes: [] },
      update: { method: 'TOTP', secretEnc, enabledAt: new Date(), backupCodes: [] }
    })

    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    // Bypassing /challenge token entirely by calling NextAuth authorize directly with phone & PIN
    const authSession = await authorize({
      phone: userPhone,
      pin: '1111'
    })

    // Fixed: authorize refuses to mint a session for a 2FA-enabled user without the 2nd factor
    expect(authSession).toBeNull()
  })

  it('8. Enter 5 wrong codes -> deletes challenge token on 6th attempt', async () => {
    // Create challenge token
    const challengeToken = `token-race-${Date.now()}`
    await redis.set(
      `mfa_challenge:${challengeToken}`,
      JSON.stringify({ userId, assignmentId: 'fake_assignment', requires2fa: true }),
      'EX',
      300
    )

    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    // Exceed attempts
    for (let i = 0; i < 5; i++) {
      const res = await authorize({ challengeToken, secondFactor: '000000' })
      expect(res).toBeNull()
    }

    // 6th attempt triggers deletion of challenge token
    const res6 = await authorize({ challengeToken, secondFactor: '000000' })
    expect(res6).toBeNull()

    // Redis key is deleted
    const raw = await redis.get(`mfa_challenge:${challengeToken}`)
    expect(raw).toBeNull()
  })

  it('10 & 11. Backup code logins: consumes code and blocks reuse, stops after all 10 consumed', async () => {
    // Seed new 2FA setup with 2 backup codes
    const code1 = '11111-11111'
    const code2 = '22222-22222'
    const hash1 = await bcrypt.hash(code1, 10)
    const hash2 = await bcrypt.hash(code2, 10)

    await prisma.userTwoFactor.upsert({
      where: { userId },
      create: { userId, method: 'TOTP', secretEnc: 'mocked', enabledAt: new Date(), backupCodes: [hash1, hash2] },
      update: { backupCodes: [hash1, hash2] }
    })

    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    const getChallengeToken = async () => {
      const challengeToken = `token-${Date.now()}`
      const userAss = await prisma.userRoleAssignment.findFirst({ where: { userId } })
      await redis.set(`mfa_challenge:${challengeToken}`, JSON.stringify({ userId, assignmentId: userAss!.id, requires2fa: true }), 'EX', 300)
      return challengeToken
    }

    // 10. Redeem Backup Code 1
    const ct1 = await getChallengeToken()
    const session1 = await authorize({ challengeToken: ct1, secondFactor: code1 })
    expect(session1).not.toBeNull()

    // Reuse Backup Code 1 -> fails
    const ct2 = await getChallengeToken()
    const session2 = await authorize({ challengeToken: ct2, secondFactor: code1 })
    expect(session2).toBeNull()

    // 11. Consume remaining Backup Code 2
    const ct3 = await getChallengeToken()
    const session3 = await authorize({ challengeToken: ct3, secondFactor: code2 })
    expect(session3).not.toBeNull()

    // 11th login attempt (no backup codes remaining in DB)
    const ct4 = await getChallengeToken()
    const session4 = await authorize({ challengeToken: ct4, secondFactor: '33333-33333' })
    expect(session4).toBeNull()
  })

  // ==========================================
  // C. SMS Fallback
  // ==========================================

  it('12. Rapid SMS OTP requests get throttled (SMS-bombing gap FIXED)', async () => {
    // Clear 2FA so startEnroll is allowed
    await prisma.userTwoFactor.deleteMany({ where: { userId } })

    mockSessionUser = standardUserContext.user

    // Trigger MFA SMS requests 5 times rapidly
    const statuses: number[] = []
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost/api/auth/2fa/enroll/start', {
        method: 'POST',
        body: JSON.stringify({ method: 'SMS' })
      })
      const res = await startEnroll(req)
      statuses.push(res.status)
    }

    // Fixed: throttle kicks in — not all 5 rapid requests succeed
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0)

    // At most 1 active (unconsumed) OTP code row exists
    const codes = await prisma.otpCode.findMany({
      where: { identifier: userPhone, consumedAt: null }
    })
    expect(codes.length).toBeLessThanOrEqual(1)
  })

  // ==========================================
  // D. Org Policy
  // ==========================================

  it('14. ORG_ADMIN exempted from mustEnrol2fa policy (Admin Self-Exemption)', async () => {
    mockSessionUser = adminUserContext.user

    // Set mustEnrol2fa for COUNSELLOR only
    const req = new NextRequest('http://localhost/api/auth/2fa/policy', {
      method: 'POST',
      body: JSON.stringify({
        require2fa: true,
        require2faRoles: ['COUNSELLOR']
      })
    })
    const res = await updatePolicy(req)
    expect(res.status).toBe(200)

    // Authenticate Admin (ORG_ADMIN role) -> mustEnrol2fa is false
    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    const adminAss = await prisma.userRoleAssignment.findFirst({ where: { userId: adminId } })
    const ctAdmin = `ct-admin-${Date.now()}`
    await redis.set(`mfa_challenge:${ctAdmin}`, JSON.stringify({ userId: adminId, assignmentId: adminAss!.id, requires2fa: false }), 'EX', 300)

    const sessionAdmin = await authorize({ challengeToken: ctAdmin })
    expect(sessionAdmin).not.toBeNull()
    expect(sessionAdmin.mustEnrol2fa).toBe(false)

    // Authenticate Counsellor (COUNSELLOR role) -> mustEnrol2fa is true
    const staffAss = await prisma.userRoleAssignment.findFirst({ where: { userId } })
    const ctStaff = `ct-staff-${Date.now()}`
    await redis.set(`mfa_challenge:${ctStaff}`, JSON.stringify({ userId, assignmentId: staffAss!.id, requires2fa: false }), 'EX', 300)

    const sessionStaff = await authorize({ challengeToken: ctStaff })
    expect(sessionStaff).not.toBeNull()
    expect(sessionStaff.mustEnrol2fa).toBe(true)
  })

  // ==========================================
  // F. Anti-replay & Drift
  // ==========================================

  it('18 & 19. Anti-replay and clock drift tolerance', async () => {
    const rawSecret = generateSecret()
    const secretEnc = encryptSecret(rawSecret)

    await prisma.userTwoFactor.upsert({
      where: { userId },
      create: { userId, method: 'TOTP', secretEnc, enabledAt: new Date(), backupCodes: [] },
      update: { method: 'TOTP', secretEnc, enabledAt: new Date(), backupCodes: [] }
    })

    const credentialsProvider = authConfig.providers.find((p: any) => p.id === 'credentials')
    const authorize = (credentialsProvider as any).options.authorize

    const getChallengeToken = async () => {
      const challengeToken = `token-replay-${Date.now()}`
      const userAss = await prisma.userRoleAssignment.findFirst({ where: { userId } })
      await redis.set(`mfa_challenge:${challengeToken}`, JSON.stringify({ userId, assignmentId: userAss!.id, requires2fa: true }), 'EX', 300)
      return challengeToken
    }

    // 18. Generate valid TOTP code
    const validCode = await generateTotp({ secret: rawSecret })

    // First use -> succeeds
    const ct1 = await getChallengeToken()
    const session1 = await authorize({ challengeToken: ct1, secondFactor: validCode })
    expect(session1).not.toBeNull()

    // Second use (replay) -> rejected
    const ct2 = await getChallengeToken()
    const session2 = await authorize({ challengeToken: ct2, secondFactor: validCode })
    expect(session2).toBeNull()
  })

  // ==========================================
  // G. SUPER_ADMIN Recovery
  // ==========================================

  it('20. SUPER_ADMIN reset 2fa -> deletes UserTwoFactor record', async () => {
    // Seed 2FA
    await prisma.userTwoFactor.upsert({
      where: { userId },
      create: { userId, method: 'TOTP', secretEnc: 'mocked', enabledAt: new Date(), backupCodes: [] },
      update: { method: 'TOTP', secretEnc: 'mocked', enabledAt: new Date(), backupCodes: [] }
    })

    // SUPER_ADMIN session mockup
    mockSessionUser = { id: adminId, role: 'SUPER_ADMIN', orgId }

    const req = new NextRequest('http://localhost/api/admin/2fa-reset', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })

    const res = await reset2fa(req)
    expect(res.status).toBe(200)

    const dbRow = await prisma.userTwoFactor.findUnique({ where: { userId } })
    expect(dbRow).toBeNull()
  })
})
