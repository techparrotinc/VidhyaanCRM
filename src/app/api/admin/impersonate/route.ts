import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { AuditAction } from '@prisma/client'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'
import { PLATFORM_ADMIN_ROLES } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. SUPER_ADMIN access required.' }, { status: 401 })
    }

    const parsed = z.object({
      orgId: z.string().min(1).max(50),
      userId: z.string().min(1).max(50)
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'orgId and userId are required' }, { status: 400 })
    }
    const { orgId, userId } = parsed.data

    // Verify target user belongs to target organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        orgId: orgId,
        deletedAt: null
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found in this organization' }, { status: 404 })
    }

    // User.orgId is null-by-convention for platform-level users, so this
    // path is normally unreachable for a platform admin — but that's a
    // convention, not a DB constraint. Block explicitly rather than trust it.
    const resolvedTargetRole = await resolveTargetUserRole(targetUser.id, targetUser.orgId)
    if (resolvedTargetRole && PLATFORM_ADMIN_ROLES.includes(resolvedTargetRole)) {
      return NextResponse.json({ error: 'Cannot impersonate a platform admin account' }, { status: 403 })
    }

    // Generate impersonation token
    const impersonateToken = crypto.randomUUID()

    // Store impersonation payload in Redis for 15 minutes (900 seconds)
    const redisPayload = {
      impersonatorId: session.user.id,
      targetUserId: targetUser.id,
      targetOrgId: orgId
    }
    await redis.set(`impersonate_token:${impersonateToken}`, JSON.stringify(redisPayload), 'EX', 900)

    // Create Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        orgId: orgId,
        action: AuditAction.IMPERSONATION_START,
        entityType: 'USER_IMPERSONATION',
        entityId: targetUser.id,
        before: {
          adminUserId: session.user.id,
          adminUserEmail: session.user.email,
          adminUserRole: session.user.role
        },
        after: {
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
          targetUserRole: resolvedTargetRole,
          impersonateToken
        },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch(e => console.error('Failed to create audit log for impersonation:', e))

    return NextResponse.json({
      success: true,
      token: impersonateToken,
      expiresIn: 900
    })

  } catch (error: any) {
    console.error('Impersonate Org API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
