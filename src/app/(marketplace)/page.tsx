import { Metadata } from 'next'
import MarketplaceHomepage from './HomeClient'

export const metadata: Metadata = {
  title: 'Find & Compare Best Schools & Learning Centers Near You',
  description:
    'Compare verified schools and learning centres across India by board, fees and reviews. Apply online and track your child\'s admission — free for parents.',
  alternates: { canonical: 'https://vidhyaan.com' },
  openGraph: {
    title: 'Find & Compare Best Schools & Learning Centers Near You',
    description:
      'Compare verified schools and learning centres across India by board, fees and reviews. Apply online and track your child\'s admission — free for parents.',
    url: 'https://vidhyaan.com',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vidhyaan',
  url: 'https://vidhyaan.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://vidhyaan.com/schools?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketplaceHomepage />
    </>
  )
}
