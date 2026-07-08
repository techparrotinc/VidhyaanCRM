import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30).regex(/^[A-Z0-9_-]+$/, 'Letters, numbers, - and _ only'),
  percentOff: z.coerce.number().int().min(1).max(50), // 50% cap = floor-price guard
  maxRedemptions: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional()
})

export async function GET() {
  const session = await auth()
  if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(
    coupons.map((c) => ({
      id: c.id,
      code: c.code,
      percentOff: c.percentOff,
      maxRedemptions: c.maxRedemptions,
      expiresAt: c.expiresAt,
      isActive: c.isActive,
      redemptions: c._count.redemptions,
      createdAt: c.createdAt
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden. SUPER_ADMIN required.' }, { status: 403 })
  }
  const parsed = couponSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }
  const { code, percentOff, maxRedemptions, expiresAt } = parsed.data
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentOff,
        maxRedemptions: maxRedemptions ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'COUPON',
          entityId: coupon.id,
          after: { code, percentOff, maxRedemptions, expiresAt }
        }
      })
      .catch(() => {})
    return NextResponse.json(coupon)
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    }
    console.error('Create coupon error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
