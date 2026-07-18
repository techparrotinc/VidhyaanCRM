import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'
import { revokeUser } from '@/lib/auth/roleRevocation'

/**
 * SUPER_ADMIN escape hatch: reset (remove) a user's second-factor enrolment
 * when they are locked out. Audit-logged. The user is forced to re-enrol on
 * next login if their org policy still requires 2FA.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user || role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. SUPER_ADMIN access required.' }, { status: 401 })
  }

  const parsed = z.object({ userId: z.string().min(1).max(50) }).safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  const { userId } = parsed.data

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, orgId: true }
  })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const existing = await prisma.userTwoFactor.findUnique({ where: { userId } })
  if (!existing) {
    return NextResponse.json({ success: true, message: 'User has no 2FA enrolment.' })
  }

  await prisma.userTwoFactor.delete({ where: { userId } })

  // This is the lost/compromised-device recovery path — exactly when any
  // lingering session on that device should stop working, not just future
  // logins gate on the new enrolment.
  await revokeUser(userId).catch(err => console.error('revokeUser after admin 2FA reset failed:', err))

  await prisma.auditLog.create({
    data: {
      orgId: target.orgId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entityType: 'UserTwoFactor',
      entityId: userId,
      after: { event: '2fa_reset_by_admin', targetUserId: userId }
    }
  })

  return NextResponse.json({ success: true })
}
