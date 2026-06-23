import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const city = searchParams.get('city') ?? undefined
    const board = searchParams.get('board') ?? undefined
    const type = searchParams.get('type') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const admissionOpen = searchParams.get('admissionOpen')
    const sort = searchParams.get('sort') ?? 'relevance'
    const page = Number(searchParams.get('page') ?? 1)
    const limit = 10
    const skip = (page - 1) * limit

    const where: any = {
      deletedAt: null
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (city) {
      where.locations = {
        some: {
          city: { contains: city, mode: 'insensitive' },
          deletedAt: null
        }
      }
    }

    if (board) {
      where.affiliations = {
        some: {
          board: { contains: board, mode: 'insensitive' }
        }
      }
    }

    if (type) {
      where.institutionType = type
    }

    if (admissionOpen === 'true') {
      where.admissionOpen = true
    }

    // Dynamic sorting mapping
    let orderBy: any = { rankingScore: 'desc' }
    if (sort === 'rating') {
      orderBy = [
        { avgRating: 'desc' },
        { rankingScore: 'desc' }
      ]
    } else if (sort === 'newest') {
      orderBy = [
        { createdAt: 'desc' },
        { rankingScore: 'desc' }
      ]
    } else if (sort === 'enquiries') {
      orderBy = [
        { enquiries: { _count: 'desc' } },
        { rankingScore: 'desc' }
      ]
    } else if (sort === 'distance') {
      orderBy = { rankingScore: 'desc' } // fallback since distance requires frontend geolocation coords
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          locations: {
            where: { deletedAt: null },
            select: {
              city: true,
              state: true,
              latitude: true,
              longitude: true,
              addressLine: true
            }
          },
          media: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { url: true }
          },
          affiliations: {
            select: {
              affiliationNo: true,
              board: true
            }
          },
          _count: {
            select: {
              enquiries: true,
              views: true
            }
          }
        }
      }),
      prisma.school.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Dynamically inject `isFeatured` for schools with rankingScore > 70
    const mappedSchools = schools.map((school: any) => ({
      ...school,
      isFeatured: school.rankingScore > 70
    }))

    return NextResponse.json({
      success: true,
      data: mappedSchools,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search schools' },
      { status: 500 }
    )
  }
}
