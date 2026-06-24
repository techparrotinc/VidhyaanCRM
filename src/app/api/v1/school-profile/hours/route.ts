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
    const { hours } = body

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: 'hours array is required' }, { status: 400 })
    }

    // Process each hour item sequentially
    for (const item of hours) {
      const dayOfWeek = parseInt(item.dayOfWeek)
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        continue
      }

      await prisma.schoolHours.upsert({
        where: {
          schoolId_dayOfWeek: {
            schoolId: school.id,
            dayOfWeek
          }
        },
        update: {
          openTime: item.openTime || null,
          closeTime: item.closeTime || null,
          isClosed: item.isClosed ?? false
        },
        create: {
          schoolId: school.id,
          orgId: user.orgId,
          dayOfWeek,
          openTime: item.openTime || null,
          closeTime: item.closeTime || null,
          isClosed: item.isClosed ?? false
        }
      })
    }

    const updatedSchool = await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, school: updatedSchool })
  } catch (error: any) {
    console.error('PUT school-profile hours error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
