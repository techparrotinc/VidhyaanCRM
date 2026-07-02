import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const affiliations = await prisma.schoolAffiliation.findMany({
      where: {
        school: {
          deletedAt: null,
          isPublished: true,
          institutionType: 'SCHOOL'
        }
      },
      select: {
        board: true,
        schoolId: true
      }
    })

    const buckets = {
      CBSE: new Set<string>(),
      ICSE: new Set<string>(),
      'State Board': new Set<string>(),
      International: new Set<string>()
    }

    affiliations.forEach((aff) => {
      const boardUpper = aff.board.trim().toUpperCase()
      const schoolId = aff.schoolId

      if (boardUpper === 'CBSE') {
        buckets.CBSE.add(schoolId)
      } else if (boardUpper === 'ICSE') {
        buckets.ICSE.add(schoolId)
      } else if (boardUpper.includes('STATE BOARD')) {
        buckets['State Board'].add(schoolId)
      } else if (
        boardUpper.includes('INTERNATIONAL') ||
        boardUpper === 'IB' ||
        boardUpper.includes('CAMBRIDGE') ||
        boardUpper === 'IGCSE'
      ) {
        buckets.International.add(schoolId)
      }
    })

    const data = {
      CBSE: buckets.CBSE.size,
      ICSE: buckets.ICSE.size,
      'State Board': buckets['State Board'].size,
      International: buckets.International.size
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  } catch (error: any) {
    console.error('Curriculum counts API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch curriculum counts' },
      { status: 500 }
    )
  }
}
