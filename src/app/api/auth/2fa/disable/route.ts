import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import {
  verifySecondFactor,
  getTwoFactorState,
  orgPolicyRequires
} from '@/lib/auth/twofactor'
import { AuditAction } from '@prisma/client'
import { revokeUser } from '@/lib/auth/roleRevocation'

/**
 * Turn off 2FA. Requires a current second factor (proves possession, not just
 * a live session) and is blocked when org policy mandates 2FA for the role.
 */

const schema = z.object({ code: z.string().min(4).max(10) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  if (!(await getTwoFactorState(userId)).enrolled) {
    return NextResponse.json({ success: false, error: 'NOT_ENROLLED' }, { status: 400 })
  }

  if (await orgPolicyRequires(session.user.orgId ?? null, session.user.role)) {
    return NextResponse.json(
      { success: false, error: 'POLICY_REQUIRED', message: 'Your organization requires 2FA — it cannot be disabled.' },
      { status: 403 }
    )
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'code required' }, { status: 400 })
  }

  if (!(await verifySecondFactor(userId, parsed.data.code))) {
    return NextResponse.json(
      { success: false, error: 'INVALID_CODE', message: 'Current code required to disable 2FA.' },
      { status: 400 }
    )
  }

  await prisma.userTwoFactor.delete({ where: { userId } })

  // Force every other active session (e.g. a stolen one the legitimate user
  // doesn't know about) to re-authenticate — 2FA state changing is exactly
  // the kind of security-sensitive event that should invalidate whatever
  // sessions already exist, not just gate new ones.
  await revokeUser(userId).catch(err => console.error('revokeUser after 2FA disable failed:', err))

  try {
    await prisma.auditLog.create({
      data: {
        orgId: session.user.orgId || null,
        userId,
        action: AuditAction.UPDATE,
        entityType: 'UserTwoFactor',
        entityId: userId,
        after: { event: '2fa_disabled' }
      }
    })
  } catch {
    // non-blocking
  }

  return NextResponse.json({ success: true })
}
