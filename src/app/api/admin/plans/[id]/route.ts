import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const price = z.coerce.number().min(0).max(100_000_000)
const planUpdateSchema = z.object({
  monthlyPrice: price.optional(),
  quarterlyPrice: price.nullable().optional(),
  annualPrice: price.nullable().optional(),
  leadCap: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const parsed = planUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { monthlyPrice, quarterlyPrice, annualPrice, leadCap, isActive } = parsed.data

    // Only SUPER_ADMIN can change prices
    const isPriceChanged = 
      monthlyPrice !== undefined || 
      quarterlyPrice !== undefined || 
      annualPrice !== undefined

    if (isPriceChanged && role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only SUPER_ADMIN can modify price tiers.' },
        { status: 403 }
      )
    }

    const plan = await prisma.plan.findUnique({
      where: { id, deletedAt: null }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice
    if (quarterlyPrice !== undefined) updateData.quarterlyPrice = quarterlyPrice
    if (annualPrice !== undefined) updateData.annualPrice = annualPrice
    if (leadCap !== undefined) updateData.leadCap = leadCap
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedPlan)

  } catch (error: any) {
    console.error('Update Plan API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
