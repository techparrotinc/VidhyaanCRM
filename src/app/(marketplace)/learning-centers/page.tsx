import { Metadata } from 'next'
import { searchSchools } from '@/lib/marketplace/search-schools'
import { LEARNING_CENTER_TYPES } from '@/constants/institutionConfig'
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
    institutionType: LEARNING_CENTER_TYPES.join(','),
    search: str(sp.search),
    city: str(sp.city),
    page: 1,
    limit: 10,
  }).catch(() => null)

  const itemListJsonLd = initial?.data?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: initial.data.map((c: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `https://vidhyaan.com/learning-centers/${c.slug}`,
        })),
      }
    : null

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <LearningCentersSearchClient initialCenters={initial?.data} />
    </>
  )
}
