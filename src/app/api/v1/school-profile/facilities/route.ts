import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

export async function PUT(req: NextRequest) {
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
    const { facilities } = body

    if (!Array.isArray(facilities)) {
      return NextResponse.json({ error: 'facilities array is required' }, { status: 400 })
    }

    // Recreate SchoolFacility records
    await prisma.schoolFacility.deleteMany({
      where: { schoolId: school.id }
    })

    if (facilities.length > 0) {
      await prisma.schoolFacility.createMany({
        data: facilities.map((f: string) => ({
          schoolId: school.id,
          orgId: user.orgId,
          name: f
        }))
      })
    }

    const updatedSchool = await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, school: updatedSchool })
  } catch (error: any) {
    console.error('PUT school-profile facilities error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
