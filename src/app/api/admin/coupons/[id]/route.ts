import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden. SUPER_ADMIN required.' }, { status: 403 })
  }
  const { id } = await context.params
  const parsed = z.object({ isActive: z.boolean() }).safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
  }
  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: parsed.data.isActive }
    })
    return NextResponse.json(coupon)
  } catch {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  }
}
