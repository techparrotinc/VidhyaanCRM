// Pure credit-wallet math — no I/O, unit-tested in tests/credits.test.ts.
// Free periods are UTC calendar months; an IST send in the first ~5.5h of
// the 1st counts against the prior UTC month (accepted trade-off).

export function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

/** True when periodStart falls in an earlier UTC month than now. */
export function needsMonthlyReset(periodStart: Date, now: Date): boolean {
  return (
    periodStart.getUTCFullYear() !== now.getUTCFullYear() ||
    periodStart.getUTCMonth() !== now.getUTCMonth()
  )
}

export interface SpendSplit {
  ok: boolean
  fromFree: number
  fromPurchased: number
  shortfall: number
}

/** Free credits are consumed before purchased ones. */
export function computeSpendSplit(
  freeRemaining: number,
  purchasedBalance: number,
  qty: number
): SpendSplit {
  const free = Math.max(0, freeRemaining)
  const purchased = Math.max(0, purchasedBalance)
  if (qty <= 0) return { ok: true, fromFree: 0, fromPurchased: 0, shortfall: 0 }

  const fromFree = Math.min(free, qty)
  const fromPurchased = Math.min(purchased, qty - fromFree)
  const shortfall = qty - fromFree - fromPurchased

  return { ok: shortfall === 0, fromFree, fromPurchased, shortfall }
}
