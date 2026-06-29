import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

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
    const body = await req.json()
    const { monthlyPrice, quarterlyPrice, annualPrice, leadCap, isActive } = body

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

    if (monthlyPrice !== undefined) {
      updateData.monthlyPrice = Number(monthlyPrice)
    }
    if (quarterlyPrice !== undefined) {
      updateData.quarterlyPrice = quarterlyPrice !== null ? Number(quarterlyPrice) : null
    }
    if (annualPrice !== undefined) {
      updateData.annualPrice = annualPrice !== null ? Number(annualPrice) : null
    }
    if (leadCap !== undefined) {
      updateData.leadCap = leadCap !== null ? parseInt(leadCap) : null
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

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
