import { NextRequest, NextResponse } from 'next/server'
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

    const parentId = parent.id
    const parentCity = parent.city || 'Chennai'

    // Run parallel counts and queries
    const [
      totalEnquiries,
      totalBookmarks,
      activeApplications,
      recentEnquiries,
      recentApplications,
      recommendedSchools
    ] = await Promise.all([
      // Count enquiries
      prisma.parentEnquiry.count({
        where: { parentId }
      }),

      // Count bookmarks
      prisma.parentBookmark.count({
        where: { parentId }
      }),

      // Count active applications (exclude rejected and withdrawn)
      prisma.parentApplication.count({
        where: {
          parentId,
          status: {
            notIn: ['REJECTED', 'WITHDRAWN']
          }
        }
      }),

      // Get last 5 enquiries
      prisma.parentEnquiry.findMany({
        where: { parentId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: {
                orderBy: { sortOrder: 'asc' },
                take: 1
              },
              locations: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),

      // Get last 5 applications
      prisma.parentApplication.findMany({
        where: { parentId },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: {
                orderBy: { sortOrder: 'asc' },
                take: 1
              },
              locations: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),

      // Recommended schools near parent city
      prisma.school.findMany({
        where: {
          isPublished: true,
          locations: {
            some: {
              city: { equals: parentCity, mode: 'insensitive' }
            }
          }
        },
        include: {
          locations: true,
          affiliations: true,
          media: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          }
        },
        take: 3
      })
    ])

    return NextResponse.json({
      success: true,
      parent: {
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        city: parent.city
      },
      stats: {
        totalEnquiries,
        totalBookmarks,
        activeApplications
      },
      recentEnquiries,
      recentApplications,
      recommendedSchools
    })

  } catch (error: any) {
    console.error('Parent dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
