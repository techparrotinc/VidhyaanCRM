// Institution-type-adaptive review sub-rating categories.
// Single source of truth for which sub-ratings a parent scores and how the UI
// + aggregation label them. Every institution type has the universal overall
// `rating` plus `feeValue`; the remaining slugs vary by type so a coaching
// centre isn't asked about "Extra-Curricular" and a sports academy isn't asked
// about "Academics".
//
// Sub-ratings are persisted in SchoolReview.subRatings (JSON) keyed by slug.
// Legacy SCHOOL rows used fixed columns (rating_academics ...); the aggregator
// maps those onto the SCHOOL slugs below for backward compatibility.

import type { InstitutionType } from '@prisma/client'

export type ReviewCategory = { slug: string; label: string }

// Slugs that map onto the legacy fixed columns for SCHOOL rows.
export const LEGACY_SCHOOL_COLUMN_BY_SLUG: Record<string, string> = {
  academics: 'ratingAcademics',
  teachers: 'ratingFaculty',
  infrastructure: 'ratingInfrastructure',
  safety: 'ratingSafety',
  extracurricular: 'ratingActivities',
  feeValue: 'ratingValue',
}

const REGISTRY: Record<InstitutionType, ReviewCategory[]> = {
  SCHOOL: [
    { slug: 'academics', label: 'Academics' },
    { slug: 'teachers', label: 'Teachers' },
    { slug: 'infrastructure', label: 'Infrastructure' },
    { slug: 'extracurricular', label: 'Extra-Curricular' },
    { slug: 'safety', label: 'Safety' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
  LEARNING_CENTER: [
    { slug: 'teaching', label: 'Teaching Quality' },
    { slug: 'personalAttention', label: 'Personal Attention' },
    { slug: 'results', label: 'Results' },
    { slug: 'studyMaterial', label: 'Study Material' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
  COACHING_CENTER: [
    { slug: 'teaching', label: 'Teaching Quality' },
    { slug: 'results', label: 'Results / Selections' },
    { slug: 'doubtClearing', label: 'Doubt Clearing' },
    { slug: 'studyMaterial', label: 'Study Material' },
    { slug: 'batchSize', label: 'Batch Size' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
  JUNIOR_COLLEGE: [
    { slug: 'academics', label: 'Academics' },
    { slug: 'teachers', label: 'Teachers' },
    { slug: 'results', label: 'Board / Exam Results' },
    { slug: 'infrastructure', label: 'Infrastructure' },
    { slug: 'discipline', label: 'Discipline' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
  SKILL_DEVELOPMENT: [
    { slug: 'trainerQuality', label: 'Trainer Quality' },
    { slug: 'curriculum', label: 'Curriculum Relevance' },
    { slug: 'outcomes', label: 'Placement / Outcomes' },
    { slug: 'practicalExposure', label: 'Practical Exposure' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
  SPORTS_ACADEMY: [
    { slug: 'coaching', label: 'Coaching Quality' },
    { slug: 'facilities', label: 'Facilities' },
    { slug: 'safety', label: 'Safety' },
    { slug: 'individualAttention', label: 'Individual Attention' },
    { slug: 'feeValue', label: 'Fee Value' },
  ],
}

const DEFAULT_TYPE: InstitutionType = 'SCHOOL'

export function getReviewCategories(
  institutionType: InstitutionType | null | undefined
): ReviewCategory[] {
  if (institutionType && REGISTRY[institutionType]) return REGISTRY[institutionType]
  return REGISTRY[DEFAULT_TYPE]
}

export function getReviewCategorySlugs(
  institutionType: InstitutionType | null | undefined
): string[] {
  return getReviewCategories(institutionType).map((c) => c.slug)
}

// Keep only slugs valid for the given type and clamp values to 1..5 ints.
// Silently drops unknown slugs so a stale client can't inject arbitrary keys.
export function sanitizeSubRatings(
  institutionType: InstitutionType | null | undefined,
  input: Record<string, unknown> | null | undefined
): Record<string, number> {
  const allowed = new Set(getReviewCategorySlugs(institutionType))
  const out: Record<string, number> = {}
  if (!input || typeof input !== 'object') return out
  for (const [slug, raw] of Object.entries(input)) {
    if (!allowed.has(slug)) continue
    const n = Math.round(Number(raw))
    if (Number.isFinite(n) && n >= 1 && n <= 5) out[slug] = n
  }
  return out
}
