import { Metadata } from 'next'
import { searchSchools } from '@/lib/marketplace/search-schools'
import LearningCentersSearchClient from './LearningCentersSearchClient'

export const metadata: Metadata = {
  title: 'Best Learning Centers Near You — Dance, Music, Art & More',
  description:
    'Discover verified learning centres near you — dance classes, music academies, art studios, sports coaching and academic tuition. Compare fees, read parent reviews and book trial classes directly.',
  alternates: { canonical: 'https://vidhyaan.com/learning-centers' },
  openGraph: {
    title: 'Best Learning Centers Near You — Dance, Music, Art & More',
    description:
      'Discover verified learning centres near you — dance classes, music academies, art studios, sports coaching and academic tuition. Compare fees, read parent reviews and book trial classes directly.',
    url: 'https://vidhyaan.com/learning-centers',
  },
}

export default async function LearningCentersSearchPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp = await searchParams
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const initial = await searchSchools({
    institutionType: 'LEARNING_CENTER',
    search: str(sp.search),
    city: str(sp.city),
    page: 1,
    limit: 10,
  }).catch(() => null)

  return <LearningCentersSearchClient initialCenters={initial?.data} />
}
