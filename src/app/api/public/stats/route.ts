import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const verifiedSchoolsCount = await prisma.school.count({
      where: {
        deletedAt: null,
        isPublished: true,
        isVerified: true,
        isDummy: false,
        institutionType: 'SCHOOL'
      }
    })

    const uniqueCities = await prisma.schoolLocation.groupBy({
      by: ['city'],
      where: {
        deletedAt: null,
        school: {
          deletedAt: null,
          isPublished: true,
          isDummy: false
        }
      }
    })

    const citiesCoveredCount = uniqueCities.filter((c) => c.city).length

    return NextResponse.json(
      {
        success: true,
        data: {
          verifiedSchoolsCount,
          citiesCoveredCount
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  } catch (error: any) {
    console.error('Public stats API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch public stats' },
      { status: 500 }
    )
  }
}
