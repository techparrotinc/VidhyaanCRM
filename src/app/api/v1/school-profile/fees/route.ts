import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

const feeRangeSchema = z.object({
  gradeLabel: z.string().trim().min(1).max(50),
  minAmount: z.coerce.number().min(0).max(100_000_000).catch(0),
  maxAmount: z.coerce.number().min(0).max(100_000_000).catch(0),
  frequency: z.string().max(30).optional().nullable()
})

// GET fee ranges
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: session.user.orgId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const feeRanges = await prisma.schoolFeeRange.findMany({
      where: { schoolId: school.id }
    })

    return NextResponse.json({ success: true, feeRanges })
  } catch (error: any) {
    console.error('GET school-profile fees error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST add fee range
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: session.user.orgId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const parsed = feeRangeSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { gradeLabel, minAmount, maxAmount, frequency } = parsed.data

    const newFeeRange = await prisma.schoolFeeRange.create({
      data: {
        schoolId: school.id,
        orgId: session.user.orgId,
        gradeLabel,
        minAmount,
        maxAmount,
        frequency: frequency || 'annual'
      }
    })

    await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, feeRange: newFeeRange })
  } catch (error: any) {
    console.error('POST school-profile fees error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
