import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getReviewCategories,
  LEGACY_SCHOOL_COLUMN_BY_SLUG,
} from '@/lib/reviews/categories'

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
        isDummy: false,
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
            },
            responses: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
              select: { id: true, authorType: true, body: true, createdAt: true }
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

    // Star distribution histogram (5★ → 1★ counts) for the summary block
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating)))
      ratingCounts[bucket]++
    })

    // Institution-type-adaptive breakdown: sum per registry slug, reading the
    // JSON subRatings first and falling back to the legacy fixed columns
    // (pre-2026-07 SCHOOL reviews) mapped via LEGACY_SCHOOL_COLUMN_BY_SLUG.
    const categories = getReviewCategories(school.institutionType)
    const sums: Record<string, { total: number; count: number }> = {}
    categories.forEach((c) => { sums[c.slug] = { total: 0, count: 0 } })

    reviews.forEach((r) => {
      const sub = (r.subRatings ?? null) as Record<string, number> | null
      categories.forEach((c) => {
        let value: number | null = null
        if (sub && typeof sub[c.slug] === 'number') {
          value = sub[c.slug]
        } else {
          const legacyCol = LEGACY_SCHOOL_COLUMN_BY_SLUG[c.slug]
          if (legacyCol && (r as any)[legacyCol] !== null && (r as any)[legacyCol] !== undefined) {
            value = (r as any)[legacyCol] as number
          }
        }
        if (value !== null) {
          sums[c.slug].total += value
          sums[c.slug].count++
        }
      })
    })

    const ratingsBreakdown: Record<string, number> = {}
    const ratingsBreakdownLabels: Record<string, string> = {}
    categories.forEach((c) => {
      const s = sums[c.slug]
      ratingsBreakdown[c.slug] = s.count > 0 ? Number((s.total / s.count).toFixed(1)) : 0
      ratingsBreakdownLabels[c.slug] = c.label
    })

    return NextResponse.json({
      success: true,
      data: {
        ...school,
        stats: {
          totalReviews,
          avgRating: Number(avgRating.toFixed(1)),
          ratingCounts,
          ratingsBreakdown,
          ratingsBreakdownLabels
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
