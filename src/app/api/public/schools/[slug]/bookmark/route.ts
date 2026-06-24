import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const { slug } = await params

    // Find Parent record by userId
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Find School by slug
    const school = await prisma.school.findUnique({
      where: { slug }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.parentBookmark.findUnique({
      where: {
        parentId_schoolId: {
          parentId: parent.id,
          schoolId: school.id
        }
      }
    })

    if (existingBookmark) {
      // Toggle off: Delete bookmark
      await prisma.parentBookmark.delete({
        where: { id: existingBookmark.id }
      })

      return NextResponse.json({
        success: true,
        bookmarked: false,
        message: 'Removed from bookmarks'
      })
    } else {
      // Toggle on: Create bookmark
      await prisma.parentBookmark.create({
        data: {
          parentId: parent.id,
          schoolId: school.id
        }
      })

      return NextResponse.json({
        success: true,
        bookmarked: true,
        message: 'School saved to bookmarks'
      })
    }

  } catch (error: any) {
    console.error('Bookmark toggle error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
