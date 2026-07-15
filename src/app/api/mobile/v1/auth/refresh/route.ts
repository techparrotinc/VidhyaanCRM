import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { isUserRevoked } from '@/lib/auth/roleRevocation'
import { resolveActiveRoleAssignment } from '@/lib/auth/resolveRoleAssignment'
import { rotateDeviceSession } from '@/lib/mobile-auth/refresh'
import { signMobileAccessToken, ACCESS_TOKEN_TTL_SECONDS } from '@/lib/mobile-auth/jwt'

/**
 * Rotate the refresh token and mint a fresh access token. Role/org are
 * re-resolved on every refresh so a role change lands within one access-token
 * lifetime; Redis revocation is honoured immediately.
 */

const bodySchema = z.object({
  refreshToken: z.string().min(40),
  deviceId: z.string().min(8).max(128)
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }

  const rotated = await rotateDeviceSession(body.refreshToken, body.deviceId)
  if (!rotated.ok) {
    return NextResponse.json(
      { success: false, code: 'SESSION_EXPIRED', error: 'Sign in again' },
      { status: 401 }
    )
  }

  if (await isUserRevoked(rotated.userId)) {
    return NextResponse.json(
      { success: false, code: 'SESSION_EXPIRED', error: 'Sign in again' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findFirst({
    where: { id: rotated.userId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, name: true }
  })
  if (!user) {
    return NextResponse.json(
      { success: false, code: 'SESSION_EXPIRED', error: 'Sign in again' },
      { status: 401 }
    )
  }

  let resolved
  try {
    resolved = await resolveActiveRoleAssignment(rotated.userId, rotated.assignmentId)
  } catch {
    // Assignment gone or ambiguous → force a fresh login.
    return NextResponse.json(
      { success: false, code: 'SESSION_EXPIRED', error: 'Sign in again' },
      { status: 401 }
    )
  }

  const accessToken = await signMobileAccessToken({
    userId: user.id,
    role: resolved.role,
    orgId: resolved.orgId,
    name: user.name,
    assignmentId: resolved.activeRoleAssignmentId,
    deviceId: body.deviceId
  })

  return NextResponse.json({
    success: true,
    accessToken,
    accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: rotated.refreshToken
  })
}
