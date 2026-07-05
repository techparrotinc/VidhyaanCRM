import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.union([z.string().max(2), z.number()]),
      openTime: z.string().max(10).optional().nullable(),
      closeTime: z.string().max(10).optional().nullable(),
      isClosed: z.boolean().optional().nullable()
    })
  ).max(7)
})

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

    const parsed = hoursSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { hours } = parsed.data

    // Process each hour item sequentially
    for (const item of hours) {
      const dayOfWeek = parseInt(String(item.dayOfWeek))
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
          orgId: session.user.orgId,
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
