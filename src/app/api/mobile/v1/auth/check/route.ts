import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { windowLimiter } from '@/lib/ratelimit'
import { findUserByPhone } from '@/lib/mobile-auth/phone'

/**
 * Mobile login step 0: does this phone have an account, and can it use PIN
 * login? Mirrors the web /api/auth/check-phone gate so the app can route to
 * the PIN screen (hasPin) or straight to OTP. Deliberately returns only the
 * minimum (exists/hasPin/first name) — no role or org detail pre-auth.
 */

const bodySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/)
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { success: false, error: 'Enter a valid phone number' },
      { status: 422 }
    )
  }

  // Dual limit: per-phone (hammering one number) AND per-IP (enumerating
  // many numbers from one client — the phone-keyed limit alone won't catch it).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const [phoneLimit, ipLimit] = await Promise.all([
    windowLimiter(`mobile-check:${body.phone.replace(/\D/g, '')}`, 10, 60),
    windowLimiter(`mobile-check-ip:${ip}`, 30, 60)
  ])
  if (!phoneLimit.success || !ipLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Try again later.' },
      { status: 429 }
    )
  }

  const user = await findUserByPhone(body.phone)
  if (!user) {
    return NextResponse.json({ success: true, exists: false, hasPin: false })
  }

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, pinHash: true }
  })

  return NextResponse.json({
    success: true,
    exists: true,
    hasPin: !!full?.pinHash,
    name: full?.name ?? null
  })
}
