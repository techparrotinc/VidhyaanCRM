import { prisma } from '@/lib/db'

export function calculateProfileCompletePct(school: any) {
  if (!school) return 0

  let score = 0

  // 1. School logo uploaded: media item with caption 'logo'
  const hasLogo = school.media && school.media.some((m: any) => m.caption === 'logo' && !m.deletedAt)
  if (hasLogo) score += 15

  // 2. Description added (min 100 chars)
  const hasDescription = school.description && school.description.trim().length >= 100
  if (hasDescription) score += 10

  // 3. Contact details complete
  const hasContacts = school.contacts && school.contacts.filter((c: any) => !c.deletedAt).length > 0
  if (hasContacts) score += 10

  // 4. Location added
  const hasLocations = school.locations && school.locations.filter((l: any) => !l.deletedAt).length > 0
  if (hasLocations) score += 10

  // 5. Board/affiliation added
  const hasAffiliations = school.affiliations && school.affiliations.length > 0
  if (hasAffiliations) score += 10

  // 6. Gallery photos (min 1): media item with caption 'gallery' or 'cover'
  const hasGallery = school.media && school.media.some((m: any) => (m.caption === 'gallery' || m.caption === 'cover') && !m.deletedAt)
  if (hasGallery) score += 15

  // 7. Fee structure added
  const hasFees = (school.feeRanges && school.feeRanges.length > 0) || school.monthlyFeeMin !== null
  if (hasFees) score += 15

  // 8. Admission status set: checks if academicYear is set
  const hasAdmission = !!(school.academicYear && school.academicYear.trim() !== '')
  if (hasAdmission) score += 15

  return Math.min(100, score)
}

export function calculateRankingScore(profileCompletePct: number, avgRating: number = 0) {
  // Balanced ranking score: 80% completion + 20% rating (max rating 5 = 20 points)
  const ratingPoints = (avgRating || 4.0) * 4 // defaults to 4.0 rating (16 points)
  return Math.min(100, Math.round(profileCompletePct * 0.8 + ratingPoints))
}

export async function recalculateAndSaveSchoolScores(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      locations: { where: { deletedAt: null } },
      contacts: { where: { deletedAt: null } },
      affiliations: true,
      media: { where: { deletedAt: null } },
      feeRanges: true
    }
  })

  if (!school) return null

  const profileCompletePct = calculateProfileCompletePct(school)
  const rankingScore = calculateRankingScore(profileCompletePct, school.avgRating)

  const updatedSchool = await prisma.school.update({
    where: { id: schoolId },
    data: {
      profileCompletion: profileCompletePct,
      rankingScore: rankingScore
    },
    include: {
      locations: { where: { deletedAt: null } },
      contacts: { where: { deletedAt: null } },
      affiliations: true,
      media: { where: { deletedAt: null } },
      feeRanges: true,
      hours: true
    }
  })

  // Also update organization settings for caching
  if (school.orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: school.orgId }
    })
    if (org) {
      const settings = (org.settings as any) || {}
      await prisma.organization.update({
        where: { id: school.orgId },
        data: {
          settings: {
            ...settings,
            profileCompletePct
          }
        }
      })
    }
  }

  return updatedSchool
}
