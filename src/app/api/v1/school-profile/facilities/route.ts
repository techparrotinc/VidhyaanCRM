import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

export async function PUT(req: NextRequest) {
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

    const parsed = z.object({
      facilities: z.array(z.string().trim().min(1).max(100)).max(200)
    }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'facilities must be an array of strings', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { facilities } = parsed.data

    // Recreate SchoolFacility records
    await prisma.schoolFacility.deleteMany({
      where: { schoolId: school.id }
    })

    if (facilities.length > 0) {
      await prisma.schoolFacility.createMany({
        data: facilities.map((f: string) => ({
          schoolId: school.id,
          orgId: session.user.orgId,
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
