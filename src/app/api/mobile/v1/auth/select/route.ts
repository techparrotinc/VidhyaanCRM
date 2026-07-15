import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyIntermediateToken } from '@/lib/mobile-auth/jwt'
import { completeLogin } from '@/lib/mobile-auth/service'

/**
 * Mobile login step 2b: multi-role users pick a workspace. The selection
 * token proves the OTP already passed on this device; 2FA (if required for
 * the chosen workspace) still runs after this step.
 */

const bodySchema = z.object({
  selectionToken: z.string().min(20),
  assignmentId: z.string().min(1),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(120).optional()
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }

  const claims = await verifyIntermediateToken(body.selectionToken, 'select')
  if (!claims) {
    return NextResponse.json(
      { success: false, error: 'Session expired — sign in again' },
      { status: 401 }
    )
  }

  const outcome = await completeLogin(
    claims.userId,
    { deviceId: claims.deviceId, platform: body.platform, deviceName: body.deviceName },
    body.assignmentId
  )
  return outcome.response
}
