import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import argon2 from 'argon2'
import { prisma } from '@/lib/db/client'
import { redis } from '@/lib/redis'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'
import { AuditAction } from '@prisma/client'

/**
 * Set (or change) the login PIN from the mobile app — mirror of the web
 * /api/auth/pin/set (same validation, argon2id params, lockout clear, audit
 * log) but authenticated with the mobile Bearer JWT. Without this, users who
 * only ever use the app could never enrol in PIN login.
 */

const OBVIOUS_PATTERNS = [
  '1111', '2222', '3333', '4444', '5555',
  '6666', '7777', '8888', '9999', '0000',
  '1234', '4321', '0123', '9876'
]

const bodySchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/)
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
    return NextResponse.json(
      { success: false, error: 'PIN must be exactly 4 digits' },
      { status: 422 }
    )
  }

  if (body.pin !== body.confirmPin) {
    return NextResponse.json({ success: false, error: 'PINs do not match' }, { status: 400 })
  }
  if (OBVIOUS_PATTERNS.includes(body.pin)) {
    return NextResponse.json(
      { success: false, error: 'Obvious PIN pattern. Choose a different one.' },
      { status: 400 }
    )
  }

  const hash = await argon2.hash(body.pin, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  })

  const user = await prisma.user.update({
    where: { id: claims.userId },
    data: { pinHash: hash, pinSetAt: new Date() }
  })

  await Promise.all([
    redis.del(`pinlock:${claims.userId}`),
    redis.del(`pinlock:${claims.userId}:attempts`)
  ])

  await prisma.auditLog.create({
    data: {
      userId: claims.userId,
      orgId: user.orgId,
      action: AuditAction.PIN_SET,
      entityType: 'USER',
      entityId: claims.userId,
      ipAddress: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null
    }
  }).catch((e) => console.error('Failed to create PIN_SET audit log:', e))

  return NextResponse.json({ success: true })
}
