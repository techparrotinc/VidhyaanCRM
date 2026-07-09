import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

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
