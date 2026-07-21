import { NextRequest, NextResponse } from 'next/server'
import { searchSchools } from '@/lib/marketplace/search-schools'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')
    const maxDistanceStr = searchParams.get('maxDistance')
    const limitParam = searchParams.get('limit')

    const result = await searchSchools({
      city: searchParams.get('city') ?? undefined,
      area: searchParams.get('area') ?? undefined,
      board: searchParams.get('board') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      admissionOpen: searchParams.get('admissionOpen') === 'true',
      sort: searchParams.get('sort') ?? 'relevance',
      page: parseInt(searchParams.get('page') ?? '1') || 1,
      limit: parseInt(limitParam ?? '10') || 10,
      limitExplicit: limitParam !== null,
      // Support both parameter names: institutionType and type
      institutionType: searchParams.get('institutionType') ?? searchParams.get('type') ?? undefined,
      lat: latStr ? parseFloat(latStr) : null,
      lng: lngStr ? parseFloat(lngStr) : null,
      maxDistance: maxDistanceStr ? parseFloat(maxDistanceStr) : 20,
      claim: searchParams.get('claim') === 'true',
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      enrollingNow: searchParams.get('enrollingNow') === 'true',
      medium: searchParams.get('medium') ?? undefined,
      classMode: searchParams.get('classMode') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Schools route search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search schools' },
      { status: 500 }
    )
  }
}
