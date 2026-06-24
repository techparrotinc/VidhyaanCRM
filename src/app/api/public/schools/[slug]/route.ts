import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { searchParams } = new URL(req.url)
    const isClaim = searchParams.get('claim') === 'true'

    const school = await prisma.school.findFirst({
      where: { 
        OR: [
          { slug },
          { id: slug }
        ],
        ...(isClaim ? {} : { isPublished: true })
      },
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
        accreditations: true,
        hours: true,
        instructors: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        batchSchedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' }
        },
        reviews: {
          where: { status: 'PUBLISHED', deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
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

    // Increment viewCount asynchronously in the background (both school view count column and schoolView log)
    prisma.school.update({
      where: { id: school.id },
      data: { viewCount: { increment: 1 } }
    }).catch((e) => console.error('Error incrementing school viewCount:', e))

    prisma.schoolView.create({
      data: {
        schoolId: school.id,
        orgId: school.orgId,
        source: 'DIRECT'
      }
    }).catch((e) => console.error('Error logging school view:', e))

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
    console.error('School profile detail API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve school details' },
      { status: 500 }
    )
  }
}
