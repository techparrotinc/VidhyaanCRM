import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileAccessToken, type MobileAccessClaims } from './jwt'

/**
 * Shared auth guard for the self-verifying `/api/mobile/v1/staff/*` BFF
 * routes (these paths are exempt from the middleware Bearer→header rewrite).
 * Returns claims for any org staff role; parents and platform users get the
 * error response instead.
 */
export async function requireStaffClaims(
  req: NextRequest
): Promise<{ claims: MobileAccessClaims & { orgId: string } } | { error: NextResponse }> {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims || !claims.orgId) {
    return { error: NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 }) }
  }
  if (claims.role === 'PARENT') {
    return { error: NextResponse.json({ success: false, error: 'Staff role required' }, { status: 403 }) }
  }
  return { claims: claims as MobileAccessClaims & { orgId: string } }
}
