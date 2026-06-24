import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify ownership of the fee range
    const feeRange = await prisma.schoolFeeRange.findFirst({
      where: { id, schoolId: school.id }
    })

    if (!feeRange) {
      return NextResponse.json({ error: 'Fee range not found' }, { status: 404 })
    }

    await prisma.schoolFeeRange.delete({
      where: { id }
    })

    await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, message: 'Fee range deleted successfully' })
  } catch (error: any) {
    console.error('DELETE school-profile fees error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
