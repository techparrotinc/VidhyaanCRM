import { Metadata } from 'next'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import SchoolProfileClient from './SchoolProfileClient'

const getSchoolSeo = cache(async (slug: string) => {
  return prisma.school.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isDummy: false,
      isPublished: true,
    },
    select: {
      name: true,
      slug: true,
      description: true,
      avgRating: true,
      reviewCount: true,
      gradesOffered: true,
      establishedYear: true,
      admissionOpen: true,
      locations: {
        where: { deletedAt: null },
        orderBy: { isPrimary: 'desc' },
        take: 1,
        select: { addressLine: true, city: true, state: true, pincode: true, latitude: true, longitude: true },
      },
      contacts: {
        where: { deletedAt: null, isPrimary: true },
        select: { type: true, value: true },
      },
      affiliations: { select: { board: true }, take: 3 },
      media: {
        where: { deletedAt: null, type: 'image' },
        orderBy: { sortOrder: 'asc' },
        take: 1,
        select: { url: true, caption: true },
      },
    },
  })
})

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const school = await getSchoolSeo(slug).catch(() => null)

  if (!school) {
    return {
      title: 'School Profile',
      robots: { index: false },
    }
  }

  const city = school.locations[0]?.city || 'India'
  const boards = school.affiliations.map((a) => a.board).filter(Boolean)
  const boardText = boards.length ? `${boards.join('/')} school` : 'school'
  const title = `${school.name}, ${city} — Admission, Fees, Reviews`
  const description = `${school.name} is a ${boardText} in ${city}${
    school.gradesOffered ? ` offering ${school.gradesOffered}` : ''
  }. Check admission process, fee structure, facilities and ${
    school.reviewCount > 0 ? `${school.reviewCount} parent reviews` : 'parent reviews'
  }. Apply directly on Vidhyaan.`
  const canonical = `https://vidhyaan.com/schools/${school.slug}`
  const ogImage = school.media[0]?.url || 'https://vidhyaan.com/opengraph-image.png'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: school.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function SchoolProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const school = await getSchoolSeo(slug).catch(() => null)

  const location = school?.locations[0]
  const phone = school?.contacts.find((c) => c.type === 'phone')?.value
  const website = school?.contacts.find((c) => c.type === 'website')?.value

  const jsonLd = school
    ? {
        '@context': 'https://schema.org',
        '@type': 'School',
        name: school.name,
        url: `https://vidhyaan.com/schools/${school.slug}`,
        ...(school.description ? { description: school.description } : {}),
        ...(school.establishedYear ? { foundingDate: String(school.establishedYear) } : {}),
        ...(school.media[0]?.url ? { image: school.media[0].url } : {}),
        ...(phone ? { telephone: phone } : {}),
        ...(website ? { sameAs: [website] } : {}),
        ...(location
          ? {
              address: {
                '@type': 'PostalAddress',
                ...(location.addressLine ? { streetAddress: location.addressLine } : {}),
                ...(location.city ? { addressLocality: location.city } : {}),
                ...(location.state ? { addressRegion: location.state } : {}),
                ...(location.pincode ? { postalCode: location.pincode } : {}),
                addressCountry: 'IN',
              },
            }
          : {}),
        ...(location?.latitude && location?.longitude
          ? { geo: { '@type': 'GeoCoordinates', latitude: location.latitude, longitude: location.longitude } }
          : {}),
        ...(school.reviewCount > 0 && school.avgRating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(school.avgRating.toFixed(1)),
                reviewCount: school.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SchoolProfileClient />
    </>
  )
}
