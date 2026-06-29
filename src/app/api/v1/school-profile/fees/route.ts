import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

// GET fee ranges
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ORG_ADMIN' || !user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: user.orgId }
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ORG_ADMIN' || !user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const school = await prisma.school.findFirst({
      where: { orgId: user.orgId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const body = await req.json()
    const { gradeLabel, minAmount, maxAmount, frequency } = body

    if (!gradeLabel) {
      return NextResponse.json({ error: 'gradeLabel is required' }, { status: 400 })
    }

    const newFeeRange = await prisma.schoolFeeRange.create({
      data: {
        schoolId: school.id,
        orgId: user.orgId,
        gradeLabel,
        minAmount: parseFloat(minAmount || 0),
        maxAmount: parseFloat(maxAmount || 0),
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
