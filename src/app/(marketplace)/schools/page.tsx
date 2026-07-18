import { Metadata } from 'next'
import { searchSchools } from '@/lib/marketplace/search-schools'
import SchoolsSearchClient from './SchoolsSearchClient'

export const metadata: Metadata = {
  title: 'Best Schools in India — Compare Fees, Boards & Reviews',
  description:
    'Browse verified CBSE, ICSE and state-board schools. Filter by location, fees and facilities, read parent reviews, and apply directly online.',
  alternates: { canonical: 'https://vidhyaan.com/schools' },
  openGraph: {
    title: 'Best Schools in India — Compare Fees, Boards & Reviews',
    description:
      'Browse verified CBSE, ICSE and state-board schools. Filter by location, fees and facilities, read parent reviews, and apply directly online.',
    url: 'https://vidhyaan.com/schools',
  },
}

export default async function SchoolsSearchPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp = await searchParams
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const initial = await searchSchools({
    institutionType: 'SCHOOL',
    search: str(sp.search),
    city: str(sp.city),
    board: str(sp.board)?.split(',')[0] || undefined,
    admissionOpen: str(sp.admissionOpen) === 'true',
    page: 1,
    limit: 10,
  }).catch(() => null)

  return (
    <SchoolsSearchClient
      initialSchools={initial?.data}
      initialPagination={initial?.pagination}
    />
  )
}
