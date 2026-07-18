import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export const revalidate = 86400 // revalidate sitemap once a day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vidhyaan.com'
  const currentDate = new Date()

  // 1. Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/schools`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/learning-centers`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/register-school`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/for-schools`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/schools/compare`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.7 },

    // Legal / trust pages
    { url: `${baseUrl}/privacy-policy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },

    // CRM Product Pages
    { url: `${baseUrl}/products`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/admission-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/campaign-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/course-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/fee-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/lead-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/notifications-alerts`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/parent-portal`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/reporting-analytics`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/student-management`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/role-based-access`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/institution-types`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },

    // Marketplace Product Pages
    { url: `${baseUrl}/products/marketplace/compare`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/marketplace/free-listing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/marketplace/search-discovery`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/products/marketplace/verified-badge`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
  ]

  // 2. Dynamic Routes (only published, non-deleted, non-dummy)
  const schools = await prisma.school.findMany({
    where: {
      isPublished: true,
      isDummy: false,
      deletedAt: null,
    },
    select: {
      slug: true,
      updatedAt: true,
      institutionType: true,
    },
  })

  const dynamicRoutes = schools.map((school) => {
    const isLC = school.institutionType === 'LEARNING_CENTER'
    const routePrefix = isLC ? '/learning-centers' : '/schools'
    return {
      url: `${baseUrl}${routePrefix}/${school.slug}`,
      lastModified: school.updatedAt || currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  return [...staticRoutes, ...dynamicRoutes]
}
