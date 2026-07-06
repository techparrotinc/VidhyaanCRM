import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const titleCase = (s: string) =>
  s.trim().replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

// Distinct cities that actually have a live listing — feeds the location
// picker so new cities (e.g. Tiruppur) appear without a code change.
export async function GET() {
  try {
    const rows = await prisma.schoolLocation.groupBy({
      by: ['city'],
      where: {
        deletedAt: null,
        city: { not: '' },
        school: {
          deletedAt: null,
          isPublished: true,
          isDummy: false
        }
      }
    })

    const cities = Array.from(
      new Set(
        rows
          .map((r) => r.city)
          .filter((c): c is string => Boolean(c))
          .map(titleCase)
      )
    ).sort()

    return NextResponse.json(
      { success: true, data: { cities } },
      { headers: { 'Cache-Control': 'public, max-age=900' } }
    )
  } catch (error: any) {
    console.error('Public locations API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
