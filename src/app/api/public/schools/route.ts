import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(
    Math.sqrt(a), Math.sqrt(1-a)
  )
  return R * c
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const city = searchParams.get('city') ?? undefined
    const area = searchParams.get('area') ?? undefined
    const board = searchParams.get('board') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const admissionOpen = searchParams.get('admissionOpen')
    const sort = searchParams.get('sort') ?? 'relevance'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(50, Math.max(1, parseInt(limitParam ?? '10') || 10))
    const skip = limitParam ? 0 : (page - 1) * limit

    // Support both parameter names: institutionType and type
    const institutionType = searchParams.get('institutionType') ?? searchParams.get('type') ?? undefined

    // GPS coordinates params
    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')
    const maxDistanceStr = searchParams.get('maxDistance')

    const userLat = latStr ? parseFloat(latStr) : null
    const userLng = lngStr ? parseFloat(lngStr) : null
    const maxDistance = maxDistanceStr ? parseFloat(maxDistanceStr) : 40 // default 40km

    const where: any = {
      deletedAt: null,
      isPublished: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        {
          locations: {
            some: {
              addressLine: { contains: search, mode: 'insensitive' },
              deletedAt: null
            }
          }
        }
      ]
    }

    if (city || area) {
      const locationConditions: any = {
        deletedAt: null
      }
      if (city) {
        locationConditions.city = { contains: city, mode: 'insensitive' }
      }
      if (area) {
        locationConditions.addressLine = { contains: area, mode: 'insensitive' }
      }
      where.locations = {
        some: locationConditions
      }
    }


    if (board) {
      where.affiliations = {
        some: {
          board: { contains: board, mode: 'insensitive' }
        }
      }
    }

    if (institutionType) {
      where.institutionType = institutionType
    }

    if (admissionOpen === 'true') {
      where.admissionOpen = true
    }

    const hasCoords = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)
    const shouldApplyDistanceFilter = hasCoords

    const includeRelations = {

      locations: {
        where: { deletedAt: null }
      },
      contacts: {
        where: { deletedAt: null }
      },
      affiliations: true,
      media: {
        orderBy: { sortOrder: 'asc' as const },
        take: 1
      },
      batchSchedules: {
        where: { isActive: true },
        take: 3
      },
      _count: {
        select: {
          enquiries: true,
          views: true
        }
      }
    }

    if (shouldApplyDistanceFilter) {
      // If coordinates are provided, retrieve all records matching non-GPS filters
      const allSchools = await prisma.school.findMany({
        where,
        include: includeRelations
      })

      // Calculate distance for each school
      const schoolsWithDistance = allSchools.map((s: any) => {
        let minDistance: number | null = null

        s.locations.forEach((loc: any) => {
          if (loc.latitude !== null && loc.longitude !== null) {
            const dist = calculateDistance(userLat!, userLng!, loc.latitude, loc.longitude)
            if (minDistance === null || dist < minDistance) {
              minDistance = dist
            }
          }
        })

        return {
          ...s,
          distance: minDistance
        }
      })

      // Filter out schools beyond maxDistance or missing coordinates
      const filteredSchools = schoolsWithDistance.filter((s: any) => {
        return s.distance !== null && s.distance <= maxDistance
      })

      // Sort matching schools
      if (sort === 'rating') {
        filteredSchools.sort((a: any, b: any) => {
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
          return (a.distance ?? 0) - (b.distance ?? 0)
        })
      } else if (sort === 'newest') {
        filteredSchools.sort((a: any, b: any) => {
          const dateB = new Date(b.createdAt).getTime()
          const dateA = new Date(a.createdAt).getTime()
          if (dateB !== dateA) return dateB - dateA
          return (a.distance ?? 0) - (b.distance ?? 0)
        })
      } else if (sort === 'enquiries') {
        filteredSchools.sort((a: any, b: any) => {
          if (b.enquiryCount !== a.enquiryCount) return b.enquiryCount - a.enquiryCount
          return (a.distance ?? 0) - (b.distance ?? 0)
        })
      } else {
        // Default sort: distance ascending
        filteredSchools.sort((a: any, b: any) => {
          return (a.distance ?? 0) - (b.distance ?? 0)
        })
      }

      const total = filteredSchools.length
      const totalPages = Math.ceil(total / limit)
      const paginatedSchools = filteredSchools.slice(skip, skip + limit)

      const mappedSchools = paginatedSchools.map((school: any) => ({
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
    } else {
      // Traditional database query if user coords are not provided
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
      }

      const [schools, total] = await Promise.all([
        prisma.school.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: includeRelations
        }),
        prisma.school.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      const mappedSchools = schools.map((school: any) => ({
        ...school,
        distance: null,
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
    }
  } catch (error: any) {
    console.error('Schools route search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search schools' },
      { status: 500 }
    )
  }
}
