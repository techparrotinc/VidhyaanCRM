/**
 * 100-point marketplace profile completeness formula.
 * Shared by onboarding status API and the setup checklist.
 */
type SchoolForCompleteness = {
  description: string | null
  monthlyFeeMin: unknown | null
  media: { caption: string | null }[]
  locations: unknown[]
  contacts: unknown[]
  affiliations: unknown[]
  feeRanges: unknown[]
}

export function calculateProfileCompletePct(school: SchoolForCompleteness | null): number {
  if (!school) return 0

  let pct = 0

  // 1. Name: 10 points (always true if registered)
  pct += 10

  // 2. Logo: 15 points (media item with caption 'logo')
  if (school.media.some(m => m.caption === 'logo')) pct += 15

  // 3. Cover photo: 15 points (media item with caption 'cover')
  if (school.media.some(m => m.caption === 'cover')) pct += 15

  // 4. Gallery: 10 points
  if (school.media.some(m => m.caption === 'gallery')) pct += 10

  // 5. Description: 10 points
  if (school.description && school.description.trim() !== '') pct += 10

  // 6. Location: 10 points
  if (school.locations.length > 0) pct += 10

  // 7. Board/affiliation: 10 points
  if (school.affiliations.length > 0) pct += 10

  // 8. Contact details: 10 points
  if (school.contacts.length > 0) pct += 10

  // 9. Fee range: 10 points
  if (school.feeRanges.length > 0 || school.monthlyFeeMin !== null) pct += 10

  return pct
}
