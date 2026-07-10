import { describe, it, expect } from 'vitest'
import {
  getReviewCategories,
  getReviewCategorySlugs,
  sanitizeSubRatings,
  LEGACY_SCHOOL_COLUMN_BY_SLUG,
} from '@/lib/reviews/categories'
import type { InstitutionType } from '@prisma/client'

const ALL_TYPES: InstitutionType[] = [
  'SCHOOL',
  'LEARNING_CENTER',
  'COACHING_CENTER',
  'JUNIOR_COLLEGE',
  'SKILL_DEVELOPMENT',
  'SPORTS_ACADEMY',
]

describe('review category registry', () => {
  it('every institution type has categories and feeValue is universal', () => {
    for (const t of ALL_TYPES) {
      const slugs = getReviewCategorySlugs(t)
      expect(slugs.length).toBeGreaterThanOrEqual(4)
      expect(slugs).toContain('feeValue')
      // no duplicate slugs within a type
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })

  it('coaching centres are not asked school-only questions', () => {
    const slugs = getReviewCategorySlugs('COACHING_CENTER')
    expect(slugs).not.toContain('extracurricular')
    expect(slugs).toContain('doubtClearing')
    expect(slugs).toContain('results')
  })

  it('sports academies are not asked about academics', () => {
    const slugs = getReviewCategorySlugs('SPORTS_ACADEMY')
    expect(slugs).not.toContain('academics')
    expect(slugs).toContain('coaching')
  })

  it('falls back to SCHOOL categories for null/undefined type', () => {
    expect(getReviewCategorySlugs(null)).toEqual(getReviewCategorySlugs('SCHOOL'))
    expect(getReviewCategorySlugs(undefined)).toEqual(getReviewCategorySlugs('SCHOOL'))
  })

  it('legacy column map covers every SCHOOL slug', () => {
    for (const slug of getReviewCategorySlugs('SCHOOL')) {
      expect(LEGACY_SCHOOL_COLUMN_BY_SLUG[slug]).toBeTruthy()
    }
  })
})

describe('sanitizeSubRatings', () => {
  it('keeps valid slugs and clamps to ints 1..5', () => {
    const out = sanitizeSubRatings('SCHOOL', {
      academics: 4,
      teachers: 4.6, // rounds to 5
      feeValue: 1,
    })
    expect(out).toEqual({ academics: 4, teachers: 5, feeValue: 1 })
  })

  it('drops unknown slugs (cross-type injection)', () => {
    const out = sanitizeSubRatings('SPORTS_ACADEMY', {
      academics: 5, // not a sports-academy category
      coaching: 4,
    })
    expect(out).toEqual({ coaching: 4 })
  })

  it('drops out-of-range and non-numeric values', () => {
    const out = sanitizeSubRatings('SCHOOL', {
      academics: 0,
      teachers: 6,
      safety: 'great' as unknown as number,
      feeValue: 3,
    })
    expect(out).toEqual({ feeValue: 3 })
  })

  it('handles null/undefined/garbage input', () => {
    expect(sanitizeSubRatings('SCHOOL', null)).toEqual({})
    expect(sanitizeSubRatings('SCHOOL', undefined)).toEqual({})
  })
})
