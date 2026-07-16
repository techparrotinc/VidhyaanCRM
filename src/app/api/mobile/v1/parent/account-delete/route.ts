import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { deleteParentAccount } from '@/lib/parent-account-delete'

/**
 * Parent account deletion from the app (Play/App Store 5.1.1(v) compliance)
 * — Bearer-authenticated twin of /api/v1/parent/account/delete.
 */
export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }
  if (claims.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Parent role required' }, { status: 403 })
  }

  const result = await deleteParentAccount(claims.userId, claims.assignmentId ?? null)
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status })
  }
  return NextResponse.json({
    success: true,
    message: 'Account deleted. Data will be fully removed within 30 days.',
    identityRemoved: result.identityRemoved
  })
}
