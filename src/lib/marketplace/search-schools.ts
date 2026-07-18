import { prisma } from '@/lib/db'

export interface SchoolSearchParams {
  city?: string
  area?: string
  board?: string
  search?: string
  admissionOpen?: boolean
  sort?: string
  page?: number
  limit?: number
  /** when set, `skip` is forced to 0 (legacy `limit` query-param behaviour) */
  limitExplicit?: boolean
  institutionType?: string
  lat?: number | null
  lng?: number | null
  maxDistance?: number
  claim?: boolean
}

export interface SchoolSearchResult {
  data: any[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

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

export async function searchSchools(params: SchoolSearchParams): Promise<SchoolSearchResult> {
  const {
    city,
    area,
    board,
    search,
    admissionOpen,
    sort = 'relevance',
    institutionType,
    maxDistance = 20,
    claim = false,
  } = params

  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(50, Math.max(1, params.limit ?? 10))
  const skip = params.limitExplicit ? 0 : (page - 1) * limit

  const userLat = params.lat ?? null
  const userLng = params.lng ?? null

  const where: any = {
    deletedAt: null,
    isDummy: false
  }

  if (!claim) {
    where.isPublished = true
    // Publish-now model: PENDING + VERIFIED listings are public (with a
    // "verification pending" badge on the profile); REJECTED stay hidden.
    where.verificationStatus = { not: 'REJECTED' }
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

  if (admissionOpen) {
    where.admissionOpen = true
  }

  const hasCoords = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)

  const includeRelations = {
    locations: {
      where: { deletedAt: null }
    },
    contacts: {
      where: { deletedAt: null }
    },
    affiliations: true,
    media: {
      // listing cards want the cover photo — never the logo, never deleted rows
      where: { deletedAt: null, NOT: { caption: 'logo' } },
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

  if (hasCoords) {
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

    // Keep schools within maxDistance. Schools with no stored coordinates
    // already passed the text filters (city/area/search) in `where` — don't
    // make them invisible just because onboarding never captured lat/lng;
    // they sort after true GPS matches instead.
    const filteredSchools = schoolsWithDistance.filter((s: any) => {
      return s.distance === null || s.distance <= maxDistance
    })

    // Sort matching schools
    if (sort === 'rating') {
      filteredSchools.sort((a: any, b: any) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
        return (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER)
      })
    } else if (sort === 'newest') {
      filteredSchools.sort((a: any, b: any) => {
        const dateB = new Date(b.createdAt).getTime()
        const dateA = new Date(a.createdAt).getTime()
        if (dateB !== dateA) return dateB - dateA
        return (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER)
      })
    } else if (sort === 'enquiries') {
      filteredSchools.sort((a: any, b: any) => {
        if (b.enquiryCount !== a.enquiryCount) return b.enquiryCount - a.enquiryCount
        return (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER)
      })
    } else {
      // Default sort: distance ascending, coord-less schools last
      filteredSchools.sort((a: any, b: any) => {
        return (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER)
      })
    }

    const total = filteredSchools.length
    const totalPages = Math.ceil(total / limit)
    const paginatedSchools = filteredSchools.slice(skip, skip + limit)

    const mappedSchools = paginatedSchools.map((school: any) => ({
      ...school,
      isFeatured: school.rankingScore > 70
    }))

    return {
      data: mappedSchools,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

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

  return {
    data: mappedSchools,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}
