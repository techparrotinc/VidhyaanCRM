import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

// Called by the "Exit Impersonation" button before signOut() destroys the
// session — IMPERSONATION_START was audited but nothing ever logged how/when
// an impersonation session actually ended (manual exit or the 30-min hard
// expiry), leaving no way to reconstruct that from the audit trail. This
// covers the manual-exit path; natural expiry has no server-side hook to log
// from (a fixed-TTL Redis/JWT expiry, not a request) and remains unaudited.
export async function POST(req: NextRequest) {
  const session = await auth()
  const impersonatorId = session?.user?.impersonatorId
  if (!session?.user || !impersonatorId) {
    return NextResponse.json({ error: 'Not an impersonation session' }, { status: 400 })
  }

  await prisma.auditLog.create({
    data: {
      userId: impersonatorId,
      orgId: session.user.orgId ?? null,
      action: AuditAction.IMPERSONATION_END,
      entityType: 'USER_IMPERSONATION',
      entityId: session.user.id,
      after: { endedBy: 'manual_exit' },
      ipAddress: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null
    }
  }).catch(e => console.error('Failed to create IMPERSONATION_END audit log:', e))

  return NextResponse.json({ success: true })
}
