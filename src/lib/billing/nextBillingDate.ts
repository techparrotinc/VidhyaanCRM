import { FeeFrequency } from '@prisma/client'

/**
 * Advances a course billing date by one cycle of its frequency.
 * ONE_TIME/CUSTOM courses don't recur — returns null so the caller can
 * stop scheduling further rounds instead of silently defaulting to monthly.
 */
export function computeNextBillingDate(current: Date, frequency: FeeFrequency): Date | null {
  const next = new Date(current)

  switch (frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      return next
    case 'BI_MONTHLY':
      next.setMonth(next.getMonth() + 2)
      return next
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      return next
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      return next
    case 'HALF_YEARLY':
      next.setMonth(next.getMonth() + 6)
      return next
    case 'ANNUAL':
      next.setFullYear(next.getFullYear() + 1)
      return next
    case 'ONE_TIME':
    case 'CUSTOM':
    default:
      return null
  }
}
