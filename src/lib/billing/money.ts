/** Pure billing arithmetic — no I/O, fully unit-tested (tests/billing-math.test.ts). */

export const GST_RATE = 0.18

/**
 * GST split for an amount in paise.
 * inclusive → amount is the final total, GST carved out (÷ 1.18).
 * exclusive → 18% added on top.
 * Invariant either way: base + gst === total.
 */
export function gstBreakupPaise(amountInPaise: number, inclusive: boolean): {
  basePaise: number
  gstPaise: number
  totalPaise: number
} {
  if (inclusive) {
    const totalPaise = amountInPaise
    const basePaise = Math.round(totalPaise / (1 + GST_RATE))
    return { basePaise, gstPaise: totalPaise - basePaise, totalPaise }
  }
  const basePaise = amountInPaise
  const gstPaise = Math.round(basePaise * GST_RATE)
  return { basePaise, gstPaise, totalPaise: basePaise + gstPaise }
}

/** Percent discount applied to a rupee value, rounded to 2 decimals. */
export function applyPercentOff(value: number, percentOff: number): number {
  const pct = Math.min(100, Math.max(0, percentOff))
  return Math.round(value * (1 - pct / 100) * 100) / 100
}

/**
 * Unused-period credit: amount × remaining whole days ÷ total period days.
 * Returns 0 when the period is over, hasn't started sensibly, or nothing remains.
 */
export function prorationCreditAmount(
  amount: number,
  periodStartMs: number,
  periodEndMs: number,
  nowMs: number
): { credit: number; remainingDays: number; totalDays: number } {
  if (amount <= 0 || nowMs >= periodEndMs || periodEndMs <= periodStartMs) {
    return { credit: 0, remainingDays: 0, totalDays: 0 }
  }
  const totalDays = Math.max(1, Math.round((periodEndMs - periodStartMs) / 86400000))
  const remainingDays = Math.max(0, Math.floor((periodEndMs - nowMs) / 86400000))
  if (remainingDays === 0) return { credit: 0, remainingDays: 0, totalDays }
  const credit = Math.round(((amount * remainingDays) / totalDays) * 100) / 100
  return { credit, remainingDays, totalDays }
}
