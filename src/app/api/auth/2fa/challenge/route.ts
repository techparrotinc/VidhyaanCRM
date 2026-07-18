import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import bcrypt from 'bcryptjs'
import { verifyPinCredentials, verifyPinToken } from '@/lib/auth/verifyPin'
import {
  resolveActiveRoleAssignment,
  MultiRoleSelectionRequiredError
} from '@/lib/auth/resolveRoleAssignment'
import { getTwoFactorState } from '@/lib/auth/twofactor'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { windowLimiter } from '@/lib/ratelimit'

/**
 * Primary-factor gate that precedes NextAuth signIn. Verifies the primary
 * factor (PIN / login-OTP / temp-token) and resolves the role assignment
 * BEFORE any session is minted, then hands back a single-use challengeToken.
 *
 * If the user has an enrolled second factor, the client must supply it to the
 * `challengeToken` credential; otherwise the client signs in with the token
 * alone. A session JWT is only ever issued by the challengeToken branch in
 * auth config — never half-authed here.
 */

const schema = z.object({
  phone: z.string().optional(),
  pin: z.string().optional(),
  contact: z.string().optional(),
  code: z.string().optional(),
  token: z.string().optional(),
  assignmentId: z.string().optional()
})

function maskPhone(phone: string): string {
  if (phone.length < 4) return '••••'
  return `••••••${phone.slice(-4)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    // 1. Verify the primary factor, mirroring the auth-config branches.
    let userId: string | null = null

    if (body.phone && body.pin) {
      const r = await verifyPinCredentials(body.phone, body.pin)
      if (!r.success) {
        return NextResponse.json(
          { success: false, error: r.error, message: r.message, retryAfter: r.retryAfter },
          { status: r.status }
        )
      }
      userId = r.userId
    } else if (body.token) {
      const r = await verifyPinToken(body.token)
      if (!r.success) {
        return NextResponse.json({ success: false, error: 'INVALID_TOKEN' }, { status: 401 })
      }
      userId = r.userId
    } else if (body.contact && body.code) {
      const otp = await prisma.otpCode.findFirst({
        where: { identifier: body.contact, consumedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' }
      })
      const devBypass = process.env.NODE_ENV === 'development' && body.code === '123456'
      if (!otp && !devBypass) {
        return NextResponse.json({ success: false, error: 'INVALID_OTP' }, { status: 401 })
      }
      if (otp) {
        if (otp.attempts >= 5) {
          await prisma.otpCode.delete({ where: { id: otp.id } })
          return NextResponse.json({ success: false, error: 'INVALID_OTP' }, { status: 401 })
        }
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
        const ok = await bcrypt.compare(body.code, otp.codeHash)
        if (!ok) {
          return NextResponse.json({ success: false, error: 'INVALID_OTP' }, { status: 401 })
        }
        await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
      }
      // INVITED users are included: their first OTP login accepts the invite
      // (activated in the NextAuth authorize step). Excluding them here 404s
      // the pre-signIn 2FA challenge and strands every invited team member.
      const user = await prisma.user.findFirst({
        where: { OR: [{ phone: body.contact }, { email: body.contact }], status: { in: ['ACTIVE', 'INVITED'] } },
        select: { id: true }
      })
      if (!user) {
        return NextResponse.json({ success: false, error: 'NO_ACCOUNT' }, { status: 404 })
      }
      userId = user.id
    } else {
      return NextResponse.json({ success: false, error: 'MISSING_CREDENTIALS' }, { status: 400 })
    }

    // 2. Resolve role assignment now so multi-role selection happens before 2FA.
    let assignmentId: string
    let orgId: string | null
    let role: string
    try {
      const resolved = await resolveActiveRoleAssignment(userId!, body.assignmentId)
      assignmentId = resolved.activeRoleAssignmentId
      orgId = resolved.orgId
      role = resolved.role
    } catch (e) {
      if (e instanceof MultiRoleSelectionRequiredError) {
        return NextResponse.json(
          { success: false, error: 'MULTI_ROLE', assignments: e.assignments },
          { status: 409 }
        )
      }
      throw e
    }

    // 3. Only an *enrolled* second factor gates the login. Org-policy-only
    //    users (required but not enrolled) sign in, then get force-enrolled by
    //    middleware.
    const state = await getTwoFactorState(userId!)
    const requires2fa = state.enrolled

    // 4. Mint single-use challenge token.
    const challengeToken = crypto.randomBytes(32).toString('hex')
    await redis.set(
      `mfa_challenge:${challengeToken}`,
      JSON.stringify({ userId, assignmentId, requires2fa }),
      'EX',
      300
    )

    // 5. If the enrolled method is SMS, dispatch the code now.
    let maskedPhone: string | undefined
    if (requires2fa && state.method === 'SMS') {
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { phone: true }
      })
      if (user?.phone) {
        maskedPhone = maskPhone(user.phone)
        // createOTP has no throttle of its own — it just deletes any prior
        // unconsumed code and issues a fresh one. Without a cap here, every
        // primary-factor attempt (or a scripted loop of them) sends a new
        // SMS, an unmetered SMS-bombing vector against an arbitrary phone.
        const smsLimit = await windowLimiter(`mfa-sms:${user.phone}`, 3, 300)
        if (!smsLimit.success) {
          return NextResponse.json(
            { success: false, error: 'TOO_MANY_SMS', message: 'Too many code requests. Try again in a few minutes.' },
            { status: 429 }
          )
        }
        const otpCode = await createOTP(user.phone, 'SMS', 'MFA')
        await sendOTP(user.phone, otpCode, 'SMS', 'MFA')
      }
    }

    return NextResponse.json({
      success: true,
      challengeToken,
      requires2fa,
      method: requires2fa ? state.method : null,
      maskedPhone,
      _role: role, // for client analytics only; session role comes from server
      orgId
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    }
    console.error('2FA challenge error:', error)
    return NextResponse.json({ success: false, error: 'CHALLENGE_FAILED' }, { status: 500 })
  }
}
