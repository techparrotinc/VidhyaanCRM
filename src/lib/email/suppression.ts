import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

// Platform-wide email suppression list (an address that hard-bounces is bad
// for every org). Fed by the ZeptoMail bounce webhook; consulted by the
// senders in src/lib/integrations/zeptomail. Checks fail OPEN — a Redis/DB
// glitch must never block OTP or invoice emails.

const CACHE_PREFIX = 'email:sup:'
const HIT_TTL = 30 * 24 * 3600
const MISS_TTL = 6 * 3600 // short: address may get suppressed later

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const norm = email.trim().toLowerCase()
  if (!norm) return false
  const key = CACHE_PREFIX + norm
  try {
    const cached = await redis.get(key)
    if (cached === '1') return true
    if (cached === '0') return false
  } catch { /* fall through to DB */ }
  try {
    const row = await prisma.emailSuppression.findUnique({
      where: { email: norm },
      select: { id: true },
    })
    const hit = !!row
    try {
      await redis.set(key, hit ? '1' : '0', 'EX', hit ? HIT_TTL : MISS_TTL)
    } catch { /* best-effort */ }
    return hit
  } catch (err) {
    console.error('[email-suppression] lookup failed, failing open:', err)
    return false
  }
}

export async function suppressEmail(
  email: string,
  reason: string,
  source?: string,
  detail?: string
): Promise<void> {
  const norm = email.trim().toLowerCase()
  if (!norm || !norm.includes('@')) return
  await prisma.emailSuppression.upsert({
    where: { email: norm },
    create: { email: norm, reason, source, detail },
    update: { reason, source, detail },
  })
  try {
    await redis.set(CACHE_PREFIX + norm, '1', 'EX', HIT_TTL)
  } catch { /* best-effort */ }
}

export async function unsuppressEmail(email: string): Promise<void> {
  const norm = email.trim().toLowerCase()
  await prisma.emailSuppression.deleteMany({ where: { email: norm } })
  try {
    await redis.del(CACHE_PREFIX + norm)
  } catch { /* best-effort */ }
}
