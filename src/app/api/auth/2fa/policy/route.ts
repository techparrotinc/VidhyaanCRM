import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

/**
 * Org-level 2FA policy. ORG_ADMIN can require a second factor for staff, and
 * optionally scope it to specific roles. Stored on Organization.settings.
 */

const ROLE_ENUM = z.enum([
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT', 'TEACHER'
])

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { settings: true }
  })
  const settings = (org?.settings ?? {}) as Record<string, unknown>
  return NextResponse.json({
    success: true,
    require2fa: settings.require2fa === true,
    require2faRoles: Array.isArray(settings.require2faRoles) ? settings.require2faRoles : []
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = z.object({
    require2fa: z.boolean(),
    require2faRoles: z.array(ROLE_ENUM).optional()
  }).safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { settings: true }
  })
  const settings = (org?.settings ?? {}) as Record<string, unknown>

  const next = {
    ...settings,
    require2fa: parsed.data.require2fa,
    require2faRoles: parsed.data.require2faRoles ?? []
  }

  await prisma.organization.update({
    where: { id: session.user.orgId },
    data: { settings: next }
  })

  await prisma.auditLog.create({
    data: {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entityType: 'Organization',
      entityId: session.user.orgId,
      after: { event: '2fa_policy_changed', require2fa: parsed.data.require2fa, roles: parsed.data.require2faRoles ?? [] }
    }
  })

  return NextResponse.json({ success: true, require2fa: parsed.data.require2fa })
}
