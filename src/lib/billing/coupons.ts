import { prisma } from '@/lib/db'

export interface CouponCheck {
  valid: boolean
  reason?: string
  couponId?: string
  code?: string
  percentOff?: number
}

/** Validates a coupon for an org: active, not expired, capacity left, one use per org. */
export async function validateCoupon(code: string, orgId: string): Promise<CouponCheck> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { valid: false, reason: 'Enter a coupon code' }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
    include: { _count: { select: { redemptions: true } } }
  })
  if (!coupon || !coupon.isActive) return { valid: false, reason: 'Invalid coupon code' }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: 'This coupon has expired' }
  if (coupon.maxRedemptions != null && coupon._count.redemptions >= coupon.maxRedemptions) {
    return { valid: false, reason: 'This coupon has been fully redeemed' }
  }
  const already = await prisma.couponRedemption.findUnique({
    where: { couponId_orgId: { couponId: coupon.id, orgId } }
  })
  if (already) return { valid: false, reason: 'Your institution has already used this coupon' }

  return { valid: true, couponId: coupon.id, code: coupon.code, percentOff: coupon.percentOff }
}

/** Records a redemption after successful payment (idempotent per org+coupon). */
export async function recordCouponRedemption(couponId: string, orgId: string, transactionId?: string) {
  await prisma.couponRedemption
    .upsert({
      where: { couponId_orgId: { couponId, orgId } },
      create: { couponId, orgId, transactionId: transactionId ?? null },
      update: {}
    })
    .catch((e) => console.error('coupon redemption record failed:', e))
}
