import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { redis } from '@/lib/redis'
import { cleanPhoneNumber } from '@/lib/utils'
import { verifyAndConsumeOtp } from '@/lib/auth/otp'
import { findOrCreateUserByPhone } from '@/lib/auth/findOrCreateUserByPhone'
import { AuditAction, UserRole, UserStatus } from '@prisma/client'

const signupSchema = z.object({
  t: z.string().regex(/^[a-f0-9]{64}$/),
  phone: z.preprocess(cleanPhoneNumber, z.string().regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit mobile number' })),
  code: z.string().min(4).max(8),
  city: z.string().trim().max(120).optional()
})

const linkSchema = z.object({
  t: z.string().regex(/^[a-f0-9]{64}$/),
  mode: z.literal('link')
})

async function peekPending(t: string) {
  const raw = await redis.get(`google_pending:${t}`)
  if (!raw) return null
  return JSON.parse(raw) as { sub: string; email: string; name: string }
}

async function deletePending(t: string) {
  await redis.del(`google_pending:${t}`) // single-use
}

/**
 * Finish a Google sign-in for a parked identity:
 *  - signup mode: phone + SMS OTP once → phone-keyed User + Parent + Google
 *    link → challenge token (redeemed via the Credentials provider).
 *    Google's email_verified IS the email deliverability proof, so the
 *    register-route email gate is intentionally skipped here.
 *  - link mode: an authenticated PARENT attaches Google to their account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    // ---- Link mode: session user attaches Google ----
    if (body.mode === 'link') {
      const parsed = linkSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Invalid link request' }, { status: 400 })
      }
      const session = await auth()
      if (!session?.user || session.user.role !== 'PARENT') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      const pending = await peekPending(parsed.data.t)
      if (!pending) {
        return NextResponse.json(
          { success: false, error: 'This link has expired. Please try again.' },
          { status: 410 }
        )
      }
      const existingLink = await prisma.userOAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider: 'google', providerAccountId: pending.sub } }
      })
      if (existingLink && existingLink.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'This Google account is already linked to another Vidhyaan account.' },
          { status: 409 }
        )
      }
      await deletePending(parsed.data.t)
      if (!existingLink) {
        await prisma.userOAuthAccount.upsert({
          where: { userId_provider: { userId: session.user.id, provider: 'google' } },
          create: {
            userId: session.user.id,
            provider: 'google',
            providerAccountId: pending.sub,
            email: pending.email
          },
          update: { providerAccountId: pending.sub, email: pending.email }
        })
      }
      return NextResponse.json({ success: true, linked: true, email: pending.email })
    }

    // ---- Signup/login-completion mode: phone + OTP ----
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }
    const { t, phone, code, city } = parsed.data

    const otpOk = await verifyAndConsumeOtp(phone, code)
    if (!otpOk) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      )
    }

    const pending = await peekPending(t)
    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'This sign-in session has expired. Please try Google sign-in again.' },
        { status: 410 }
      )
    }

    // Google account already claimed by another user → refuse quietly.
    const claimed = await prisma.userOAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: pending.sub } }
    })
    if (claimed) {
      return NextResponse.json(
        { success: false, error: 'This Google account is already linked to a Vidhyaan account. Please log in with Google.' },
        { status: 409 }
      )
    }

    // Email columns are unique — another account (e.g. a staff login or an
    // old parent profile under a different phone) may already hold this
    // Google email. The phone stays the identity key, so fall back to
    // creating the account WITHOUT User.email; the Google link itself
    // (UserOAuthAccount.email) still records the verified address.
    const emailHolder = await prisma.user.findFirst({
      where: { email: pending.email, deletedAt: null },
      select: { id: true, phone: true }
    })
    const emailFree = !emailHolder || emailHolder.phone === phone

    const { user, isNewUser } = await findOrCreateUserByPhone({
      phone,
      name: pending.name || 'Parent',
      email: emailFree ? pending.email : null,
      role: UserRole.PARENT,
      orgId: null,
      status: UserStatus.ACTIVE
    })

    // Existing phone must already be a parent — never attach Google to a
    // staff-only login (multi-role self-service is explicitly deferred).
    const parentAssignment = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, role: 'PARENT', status: 'ACTIVE' }
    })
    if (!parentAssignment) {
      return NextResponse.json(
        { success: false, error: 'This phone number belongs to a staff account. Please use your regular login.' },
        { status: 409 }
      )
    }

    // Past this point the only remaining failures are unexpected (500s), so
    // the token is safe to burn now — retries against a stale token would
    // otherwise loop back to the phone-entry screen every time.
    await deletePending(t)

    // Backfill a verified email onto an existing user missing one.
    if (!isNewUser && !user.email && emailFree) {
      await prisma.user
        .update({ where: { id: user.id }, data: { email: pending.email } })
        .catch(() => {}) // unique collision with another user — leave as-is
    }

    // Parent.email is unique too — same fallback rule.
    const parentEmailHolder = await prisma.parent.findFirst({
      where: { email: pending.email, deletedAt: null },
      select: { phone: true }
    })
    const parentEmailFree = !parentEmailHolder || parentEmailHolder.phone === phone

    // Upsert marketplace Parent (an enquiry may have pre-created the row).
    const existingParent = await prisma.parent.findUnique({ where: { phone } })
    let parentRecord
    if (existingParent) {
      parentRecord = await prisma.parent.update({
        where: { id: existingParent.id },
        data: {
          userId: user.id,
          name: existingParent.name || pending.name || 'Parent',
          email: existingParent.email || (parentEmailFree ? pending.email : null),
          city: city || existingParent.city
        }
      })
    } else {
      parentRecord = await prisma.parent.create({
        data: {
          userId: user.id,
          name: pending.name || 'Parent',
          phone,
          email: parentEmailFree ? pending.email : null,
          city: city || null
        }
      })
    }

    // Store the Google link (race-safe: concurrent completion → treat as done).
    try {
      await prisma.userOAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: pending.sub,
          email: pending.email
        }
      })
    } catch (e: any) {
      if (e?.code !== 'P2002') throw e
    }

    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: AuditAction.CREATE,
          entityType: 'USER',
          entityId: user.id,
          ipAddress: req.headers.get('x-forwarded-for') ?? null,
          userAgent: req.headers.get('user-agent') ?? null,
          after: {
            name: pending.name,
            phone,
            email: pending.email,
            role: UserRole.PARENT,
            parentId: parentRecord.id,
            via: 'google_sso'
          }
        }
      })
      .catch((e) => console.error('Failed to write google-signup audit log:', e))

    // Mint the challenge token the client redeems via signIn('credentials').
    const challengeToken = crypto.randomBytes(32).toString('hex')
    await redis.set(
      `mfa_challenge:${challengeToken}`,
      JSON.stringify({ userId: user.id, assignmentId: parentAssignment.id, requires2fa: false }),
      'EX',
      60
    )

    return NextResponse.json({ success: true, challengeToken })
  } catch (error: any) {
    console.error('google/complete error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
