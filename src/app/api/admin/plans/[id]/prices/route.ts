import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const price = z.coerce.number().min(0).max(100_000_000)
const slabPriceSchema = z.object({
  slab: z.enum(['S50', 'S100', 'S200', 'S500', 'S500_PLUS']),
  monthlyPrice: price,
  annualPrice: price,
  launchMonthly: price.nullable().optional(),
  launchEndsAt: z.string().datetime().nullable().optional(),
  bundledAiCredits: z.coerce.number().int().min(0).max(1_000_000).optional(),
  overagePerStudent: price.nullable().optional()
})

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only SUPER_ADMIN can modify slab prices.' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const parsed = slabPriceSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { slab, monthlyPrice, annualPrice, launchMonthly, launchEndsAt, bundledAiCredits, overagePerStudent } = parsed.data

    if (launchMonthly != null && launchMonthly > monthlyPrice) {
      return NextResponse.json(
        { error: 'Launch offer price cannot exceed the list monthly price' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.findUnique({ where: { id, deletedAt: null } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const previous = await prisma.planPrice.findUnique({
      where: { planId_slab: { planId: id, slab } }
    })

    const data = {
      monthlyPrice,
      annualPrice,
      launchMonthly: launchMonthly ?? null,
      launchEndsAt: launchEndsAt ? new Date(launchEndsAt) : null,
      ...(bundledAiCredits !== undefined ? { bundledAiCredits } : {}),
      overagePerStudent: overagePerStudent ?? null
    }
    const updated = await prisma.planPrice.upsert({
      where: { planId_slab: { planId: id, slab } },
      create: { planId: id, slab, ...data, bundledAiCredits: bundledAiCredits ?? 0 },
      update: data
    })

    // Price-change history for quarterly pricing reviews
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'PLAN_PRICE',
          entityId: updated.id,
          before: previous
            ? {
                slab,
                monthlyPrice: Number(previous.monthlyPrice),
                annualPrice: Number(previous.annualPrice),
                launchMonthly: previous.launchMonthly ? Number(previous.launchMonthly) : null
              }
            : undefined,
          after: { slab, monthlyPrice, annualPrice, launchMonthly: launchMonthly ?? null }
        }
      })
      .catch((e) => console.error('plan price audit failed:', e))

    return NextResponse.json({
      slab: updated.slab,
      monthlyPrice: Number(updated.monthlyPrice),
      annualPrice: Number(updated.annualPrice),
      launchMonthly: updated.launchMonthly ? Number(updated.launchMonthly) : null,
      bundledAiCredits: updated.bundledAiCredits,
      overagePerStudent: updated.overagePerStudent ? Number(updated.overagePerStudent) : null
    })
  } catch (error: any) {
    console.error('Update Plan Slab Price API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
