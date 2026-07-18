import { cache } from 'react'
import { prisma } from '@/lib/db'

// City/board hub pages share the /schools/[slug] route with school profiles.
// A slug is resolved as a school FIRST (existing behaviour is never shadowed);
// only unmatched slugs are tried as hubs.

export type HubTarget =
  | { type: 'city'; city: string; slug: string }
  | { type: 'board'; board: string; slug: string }

// Known board hubs — slug → the value matched against SchoolAffiliation.board
// (contains, case-insensitive, same as the search filter).
export const BOARD_HUBS: Record<string, string> = {
  cbse: 'CBSE',
  icse: 'ICSE',
  igcse: 'IGCSE',
  ib: 'IB',
  'state-board': 'State Board',
  international: 'International',
}

export function slugifyCity(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, '-')
}

function deslugifyCity(slug: string): string {
  return slug.replace(/-/g, ' ')
}

export const resolveHubSlug = cache(async (slug: string): Promise<HubTarget | null> => {
  const lower = slug.toLowerCase()

  if (BOARD_HUBS[lower]) {
    return { type: 'board', board: BOARD_HUBS[lower], slug: lower }
  }

  const cityCandidate = deslugifyCity(lower)
  const loc = await prisma.schoolLocation.findFirst({
    where: {
      deletedAt: null,
      city: { equals: cityCandidate, mode: 'insensitive' },
      school: { isPublished: true, isDummy: false, deletedAt: null },
    },
    select: { city: true },
  })
  if (loc?.city) {
    return { type: 'city', city: loc.city, slug: slugifyCity(loc.city) }
  }

  return null
})

/** Cities with enough published schools to warrant an indexable hub page. */
export const HUB_MIN_SCHOOLS = 3

export const getHubCities = cache(async (): Promise<Array<{ city: string; slug: string; count: number }>> => {
  const rows = await prisma.schoolLocation.groupBy({
    by: ['city'],
    where: {
      deletedAt: null,
      city: { not: null },
      school: { isPublished: true, isDummy: false, deletedAt: null, institutionType: 'SCHOOL' },
    },
    _count: true,
  })
  return rows
    .filter((r) => r.city && r._count >= HUB_MIN_SCHOOLS)
    .map((r) => ({ city: r.city as string, slug: slugifyCity(r.city as string), count: r._count }))
    .sort((a, b) => b.count - a.count)
})
