import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    const school = await prisma.school.findUnique({
      where: { slug },
      include: {
        locations: {
          where: { deletedAt: null }
        },
        contacts: {
          where: { deletedAt: null }
        },
        media: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' }
        },
        facilities: true,
        feeRanges: true,
        affiliations: true,
        hours: true,
        reviews: {
          where: { status: 'PUBLISHED', deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            parent: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // Calculate reviews aggregates
    const reviews = await prisma.schoolReview.findMany({
      where: { schoolId: school.id, status: 'PUBLISHED', deletedAt: null }
    })

    const totalReviews = reviews.length
    const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0

    let avgAcademics = 0, avgFaculty = 0, avgInfrastructure = 0, avgSafety = 0, avgActivities = 0, avgValue = 0
    let countAcad = 0, countFac = 0, countInfra = 0, countSafe = 0, countAct = 0, countVal = 0

    reviews.forEach((r) => {
      if (r.ratingAcademics !== null) { avgAcademics += r.ratingAcademics; countAcad++ }
      if (r.ratingFaculty !== null) { avgFaculty += r.ratingFaculty; countFac++ }
      if (r.ratingInfrastructure !== null) { avgInfrastructure += r.ratingInfrastructure; countInfra++ }
      if (r.ratingSafety !== null) { avgSafety += r.ratingSafety; countSafe++ }
      if (r.ratingActivities !== null) { avgActivities += r.ratingActivities; countAct++ }
      if (r.ratingValue !== null) { avgValue += r.ratingValue; countVal++ }
    })

    const ratingsBreakdown = {
      academics: countAcad > 0 ? Number((avgAcademics / countAcad).toFixed(1)) : 0,
      faculty: countFac > 0 ? Number((avgFaculty / countFac).toFixed(1)) : 0,
      infrastructure: countInfra > 0 ? Number((avgInfrastructure / countInfra).toFixed(1)) : 0,
      safety: countSafe > 0 ? Number((avgSafety / countSafe).toFixed(1)) : 0,
      activities: countAct > 0 ? Number((avgActivities / countAct).toFixed(1)) : 0,
      value: countVal > 0 ? Number((avgValue / countVal).toFixed(1)) : 0
    }

    // Increment view count analytics in the background
    await prisma.schoolView.create({
      data: {
        schoolId: school.id,
        orgId: school.orgId,
        source: 'DIRECT'
      }
    }).catch((e) => console.error('Error logging school view:', e))

    return NextResponse.json({
      success: true,
      data: {
        ...school,
        stats: {
          totalReviews,
          avgRating: Number(avgRating.toFixed(1)),
          ratingsBreakdown
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve school details' },
      { status: 500 }
    )
  }
}
