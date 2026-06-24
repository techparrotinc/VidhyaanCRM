import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const locations = await prisma.schoolLocation.findMany({
      where: {
        deletedAt: null,
        school: {
          deletedAt: null,
          isPublished: true
        }
      },
      include: {
        school: {
          select: {
            id: true,
            institutionType: true
          }
        }
      }
    })

    const cityMap: Record<
      string,
      {
        city: string
        state: string
        schoolsSeen: Set<string>
        lcsSeen: Set<string>
      }
    > = {}

    locations.forEach((loc) => {
      if (!loc.city) return

      // Normalize city name casing (e.g. "Chennai")
      const cityName = loc.city
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      const stateName = loc.state || 'Tamil Nadu'

      if (!cityMap[cityName]) {
        cityMap[cityName] = {
          city: cityName,
          state: stateName,
          schoolsSeen: new Set<string>(),
          lcsSeen: new Set<string>()
        }
      }

      if (loc.school.institutionType === 'SCHOOL') {
        cityMap[cityName].schoolsSeen.add(loc.school.id)
      } else if (loc.school.institutionType === 'LEARNING_CENTER') {
        cityMap[cityName].lcsSeen.add(loc.school.id)
      }
    })

    const cityList = Object.values(cityMap).map((c) => ({
      city: c.city,
      state: c.state,
      schoolCount: c.schoolsSeen.size,
      lcCount: c.lcsSeen.size,
      totalCount: c.schoolsSeen.size + c.lcsSeen.size
    }))

    // Order by totalCount descending (most popular cities first)
    cityList.sort((a, b) => b.totalCount - a.totalCount)

    return NextResponse.json(
      { success: true, data: cityList },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  } catch (error: any) {
    console.error('Cities grouping API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list cities' },
      { status: 500 }
    )
  }
}
