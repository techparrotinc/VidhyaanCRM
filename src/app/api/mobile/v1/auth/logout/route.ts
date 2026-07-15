import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { revokeDeviceSession } from '@/lib/mobile-auth/refresh'

/** Kill this device's session. The access token dies at its 15-min expiry. */
export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }

  await revokeDeviceSession(claims.userId, claims.deviceId)
  return NextResponse.json({ success: true })
}
