import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { validateCoupon } from '@/lib/billing/coupons'

/** School-side coupon validation for the checkout order page. */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const parsed = z.object({ code: z.string().min(1).max(40) }).safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: 'Enter a coupon code' })
  }
  const result = await validateCoupon(parsed.data.code, session.user.orgId)
  // Never leak coupon internals on failure
  return NextResponse.json(
    result.valid
      ? { valid: true, code: result.code, percentOff: result.percentOff }
      : { valid: false, reason: result.reason }
  )
}
