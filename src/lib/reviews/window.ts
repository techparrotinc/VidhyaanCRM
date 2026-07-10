// 6-month re-review window (pure, tested). A parent's review of a school (per
// kid) is editable in place while "fresh"; once older than the window they may
// write a NEW review — the old one stays visible and dated, so readers see the
// school's trajectory over time.

export const REVIEW_WINDOW_DAYS = 183 // ~6 months

export function canWriteNewReview(latestReviewCreatedAt: Date, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - latestReviewCreatedAt.getTime()
  return ageMs >= REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
}
