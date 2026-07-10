import { describe, it, expect } from 'vitest'
import { canWriteNewReview, REVIEW_WINDOW_DAYS } from '@/lib/reviews/window'

const dayMs = 24 * 60 * 60 * 1000

describe('canWriteNewReview (6-month window)', () => {
  const now = new Date('2026-07-10T12:00:00Z')

  it('review from yesterday → edit in place, no new review', () => {
    expect(canWriteNewReview(new Date(now.getTime() - 1 * dayMs), now)).toBe(false)
  })

  it('review from 5 months ago → still edit in place', () => {
    expect(canWriteNewReview(new Date(now.getTime() - 150 * dayMs), now)).toBe(false)
  })

  it('review exactly at the window → new review allowed', () => {
    expect(canWriteNewReview(new Date(now.getTime() - REVIEW_WINDOW_DAYS * dayMs), now)).toBe(true)
  })

  it('review from a year ago → new review allowed', () => {
    expect(canWriteNewReview(new Date(now.getTime() - 365 * dayMs), now)).toBe(true)
  })
})
