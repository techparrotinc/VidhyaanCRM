import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'

/** Register/refresh the Expo push token for the calling device. */

const bodySchema = z.object({
  pushToken: z.string().min(10).max(300).nullable()
})

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  const claims = token ? await verifyMobileAccessToken(token) : null
  if (!claims) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }

  await prisma.mobileDevice.updateMany({
    where: { userId: claims.userId, deviceId: claims.deviceId, revokedAt: null },
    data: { pushToken: body.pushToken, lastSeenAt: new Date() }
  })

  return NextResponse.json({ success: true })
}
