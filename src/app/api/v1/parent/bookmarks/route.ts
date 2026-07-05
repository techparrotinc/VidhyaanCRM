import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    const schoolIdParam = req.nextUrl.searchParams.get('schoolId')

    if (schoolIdParam) {
      // Check specific school bookmark status
      const bookmark = await prisma.parentBookmark.findUnique({
        where: {
          parentId_schoolId: {
            parentId: parent.id,
            schoolId: schoolIdParam
          }
        }
      })
      return NextResponse.json({
        success: true,
        bookmarked: !!bookmark
      })
    }

    // List all bookmarks
    const bookmarks = await prisma.parentBookmark.findMany({
      where: { parentId: parent.id },
      include: {
        school: {
          include: {
            media: {
              orderBy: { sortOrder: 'asc' },
              take: 1
            },
            locations: true,
            affiliations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: bookmarks
    })

  } catch (error: any) {
    console.error('Bookmarks GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    const parsed = z.object({ schoolId: z.string().min(1).max(50) }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      )
    }
    const { schoolId } = parsed.data

    // Check if already bookmarked
    const existing = await prisma.parentBookmark.findUnique({
      where: {
        parentId_schoolId: {
          parentId: parent.id,
          schoolId
        }
      }
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Already bookmarked'
      })
    }

    // Create new bookmark
    const bookmark = await prisma.parentBookmark.create({
      data: {
        parentId: parent.id,
        schoolId
      }
    })

    return NextResponse.json({
      success: true,
      data: bookmark,
      message: 'School saved to bookmarks'
    })

  } catch (error: any) {
    console.error('Bookmarks POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Read parameters from query or body
    let bookmarkId = req.nextUrl.searchParams.get('bookmarkId')
    let schoolId = req.nextUrl.searchParams.get('schoolId')

    if (!bookmarkId && !schoolId) {
      try {
        const body = z.object({
          bookmarkId: z.string().max(50).optional().nullable(),
          schoolId: z.string().max(50).optional().nullable()
        }).parse(await req.json())
        bookmarkId = body.bookmarkId ?? null
        schoolId = body.schoolId ?? null
      } catch (e) {}
    }

    if (!bookmarkId && !schoolId) {
      return NextResponse.json(
        { success: false, error: 'Either bookmarkId or schoolId must be provided' },
        { status: 400 }
      )
    }

    if (bookmarkId) {
      const bookmark = await prisma.parentBookmark.findUnique({
        where: { id: bookmarkId }
      })

      if (!bookmark) {
        return NextResponse.json(
          { success: false, error: 'Bookmark record not found' },
          { status: 404 }
        )
      }

      if (bookmark.parentId !== parent.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden. Bookmark record does not belong to you.' },
          { status: 403 }
        )
      }

      await prisma.parentBookmark.delete({
        where: { id: bookmarkId }
      })
    } else if (schoolId) {
      await prisma.parentBookmark.deleteMany({
        where: {
          parentId: parent.id,
          schoolId
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from bookmarks'
    })

  } catch (error: any) {
    console.error('Bookmarks DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
