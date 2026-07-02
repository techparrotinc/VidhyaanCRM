import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { recalculateAndSaveSchoolScores } from '@/lib/school-profile-helper'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify ownership
    const targetMedia = await prisma.schoolMedia.findFirst({
      where: { id, schoolId: school.id, deletedAt: null }
    })

    if (!targetMedia) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 })
    }

    // Logo cannot be set as cover / primary gallery photo
    if (targetMedia.caption === 'logo') {
      return NextResponse.json({ error: 'Cannot set logo as primary photo' }, { status: 400 })
    }

    // Find all active non-logo media
    const otherMedia = await prisma.schoolMedia.findMany({
      where: {
        schoolId: school.id,
        deletedAt: null,
        NOT: { caption: 'logo' }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Filter out the target media
    const remainingGallery = otherMedia.filter((m) => m.id !== targetMedia.id)

    // Update target to be the cover (sortOrder = 1)
    await prisma.schoolMedia.update({
      where: { id: targetMedia.id },
      data: { caption: 'cover', sortOrder: 1 }
    })

    // Update all others to be gallery, sorted from sortOrder = 2 onwards
    for (let i = 0; i < remainingGallery.length; i++) {
      const item = remainingGallery[i]
      await prisma.schoolMedia.update({
        where: { id: item.id },
        data: { caption: 'gallery', sortOrder: i + 2 }
      })
    }

    const updatedSchool = await recalculateAndSaveSchoolScores(school.id)

    return NextResponse.json({ success: true, school: updatedSchool })
  } catch (error: any) {
    console.error('PUT school-profile primary media error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
