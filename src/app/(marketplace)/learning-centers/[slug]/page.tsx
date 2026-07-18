import { Metadata } from 'next'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import LearningCenterClient from './LearningCenterClient'

const getCenterSeo = cache(async (slug: string) => {
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
      centerCategory: true,
      activityTypes: true,
      trialClassAvailable: true,
      monthlyFeeMin: true,
      monthlyFeeMax: true,
      ageGroupMin: true,
      ageGroupMax: true,
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
  const center = await getCenterSeo(slug).catch(() => null)

  if (!center) {
    return {
      title: 'Learning Center Profile',
      robots: { index: false },
    }
  }

  const city = center.locations[0]?.city || 'India'
  const activities = center.activityTypes
    .slice(0, 3)
    .map((a) => a.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ')
  const title = `${center.name}, ${city} — Classes, Fees, Reviews`
  const description = `${center.name} in ${city}${
    activities ? ` offers ${activities} classes` : ''
  }${center.trialClassAvailable ? ' with free trial classes' : ''}. Check batch timings, fee structure and ${
    center.reviewCount > 0 ? `${center.reviewCount} parent reviews` : 'parent reviews'
  }. Book directly on Vidhyaan.`
  const canonical = `https://vidhyaan.com/learning-centers/${center.slug}`
  const ogImage = center.media[0]?.url || 'https://vidhyaan.com/opengraph-image.png'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: center.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function LearningCenterDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const center = await getCenterSeo(slug).catch(() => null)

  const location = center?.locations[0]
  const phone = center?.contacts.find((c) => c.type === 'phone')?.value
  const website = center?.contacts.find((c) => c.type === 'website')?.value

  const jsonLd = center
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        additionalType: 'https://schema.org/EducationalOrganization',
        name: center.name,
        url: `https://vidhyaan.com/learning-centers/${center.slug}`,
        ...(center.description ? { description: center.description } : {}),
        ...(center.media[0]?.url ? { image: center.media[0].url } : {}),
        ...(phone ? { telephone: phone } : {}),
        ...(website ? { sameAs: [website] } : {}),
        ...(center.monthlyFeeMin
          ? {
              priceRange: center.monthlyFeeMax
                ? `₹${center.monthlyFeeMin}–₹${center.monthlyFeeMax}/month`
                : `From ₹${center.monthlyFeeMin}/month`,
            }
          : {}),
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
        ...(center.reviewCount > 0 && center.avgRating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(center.avgRating.toFixed(1)),
                reviewCount: center.reviewCount,
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
      <LearningCenterClient />
    </>
  )
}
