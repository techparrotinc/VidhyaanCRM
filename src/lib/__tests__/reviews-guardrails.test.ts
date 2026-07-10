import { describe, it, expect } from 'vitest'
import { checkReviewContent, checkReviewRisk } from '@/lib/reviews/guardrails'

describe('checkReviewContent', () => {
  it('publishes clean reviews', () => {
    expect(
      checkReviewContent('Great teachers, my daughter improved a lot this year. Worth the fee.')
    ).toEqual({ action: 'PUBLISH' })
  })

  it('blocks phone numbers (plain, +91, spaced)', () => {
    expect(checkReviewContent('Call me at 9876543210 for details').action).toBe('BLOCK')
    expect(checkReviewContent('contact +91 98765 43210').action).toBe('BLOCK')
    expect(checkReviewContent('my number 098765-43210').action).toBe('BLOCK')
  })

  it('blocks emails and links', () => {
    expect(checkReviewContent('mail me on test@example.com').action).toBe('BLOCK')
    expect(checkReviewContent('see https://myblog.example.com/post').action).toBe('BLOCK')
    expect(checkReviewContent('visit myschoolreviews.in for more').action).toBe('BLOCK')
  })

  it('holds profanity (english + tanglish/hinglish)', () => {
    expect(checkReviewContent('this school is bullshit').action).toBe('HOLD')
    expect(checkReviewContent('principal is a chutiya').action).toBe('HOLD')
  })

  it('does not false-positive on innocent numbers and words', () => {
    // 4-digit fee, year, class — not phone patterns
    expect(checkReviewContent('Fee is 45000 per year, class of 2026, 40 students per batch').action).toBe('PUBLISH')
    // substrings must not match profanity (word boundary)
    expect(checkReviewContent('the class assessment was hit').action).toBe('PUBLISH')
  })
})

describe('checkReviewRisk', () => {
  const dayMs = 24 * 60 * 60 * 1000

  it('holds low rating from brand-new unverified account', () => {
    expect(
      checkReviewRisk({
        rating: 1,
        parentCreatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h old
        isVerifiedAdmission: false,
      }).action
    ).toBe('HOLD')
  })

  it('publishes low rating from older account', () => {
    expect(
      checkReviewRisk({
        rating: 1,
        parentCreatedAt: new Date(Date.now() - 30 * dayMs),
        isVerifiedAdmission: false,
      }).action
    ).toBe('PUBLISH')
  })

  it('publishes low rating from verified admission even if account is new', () => {
    expect(
      checkReviewRisk({
        rating: 2,
        parentCreatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isVerifiedAdmission: true,
      }).action
    ).toBe('PUBLISH')
  })

  it('publishes high ratings from new accounts (no hold)', () => {
    expect(
      checkReviewRisk({
        rating: 5,
        parentCreatedAt: new Date(),
        isVerifiedAdmission: false,
      }).action
    ).toBe('PUBLISH')
  })
})
