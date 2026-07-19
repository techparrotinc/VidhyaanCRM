// Rule-based insight generators (PRD Part 4). Pure functions over already-
// computed numbers so every rule is unit-testable; endpoints gather the
// inputs. Each item renders as a sentence + severity chip + deep link.

export type AttentionItem = {
  severity: 'critical' | 'warning' | 'info'
  message: string
  href: string
}

export type ExecutiveAttentionInput = {
  uncontacted48h: number
  invoicesOverdue60d: number
  overdue60dAmount: number
  gradesNearCapacity: { grade: string; filled: number; total: number }[]
  stuckAdmissions: number
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function buildExecutiveAttention(
  input: ExecutiveAttentionInput
): AttentionItem[] {
  const items: AttentionItem[] = []

  if (input.uncontacted48h > 0) {
    items.push({
      severity: 'critical',
      message: `${plural(input.uncontacted48h, 'lead')} uncontacted for over 48 hours`,
      href: '/lead-management?uncontacted=48h'
    })
  }

  if (input.invoicesOverdue60d > 0) {
    items.push({
      severity: 'critical',
      message: `${plural(input.invoicesOverdue60d, 'invoice')} overdue by more than 60 days (₹${Math.round(input.overdue60dAmount).toLocaleString('en-IN')})`,
      href: '/fee-management?status=OVERDUE&age=60'
    })
  }

  for (const g of input.gradesNearCapacity) {
    const pct = Math.round((g.filled / g.total) * 100)
    items.push({
      severity: pct >= 100 ? 'info' : 'warning',
      message:
        pct >= 100
          ? `${g.grade} is full (${g.filled}/${g.total} seats)`
          : `${g.grade} at ${pct}% of capacity (${g.filled}/${g.total} seats)`,
      // Capacity chart lives on the admission-pipeline report; the list page
      // has no capacity view.
      href: '/reports/r/admission-pipeline'
    })
  }

  if (input.stuckAdmissions > 0) {
    items.push({
      severity: 'warning',
      message: `${plural(input.stuckAdmissions, 'application')} idle for 14+ days`,
      href: '/admission-management?stuck=14d'
    })
  }

  const order = { critical: 0, warning: 1, info: 2 }
  return items.sort((a, b) => order[a.severity] - order[b.severity])
}

export type FinanceAttentionInput = {
  collectionRateMTD: number | null // 0..1, null when nothing billed yet
  ninetyPlusGrowthPct: number | null // MoM growth of the 90+ bucket, null when no base
  concessionPctMTD: number | null // concessions as share of billed
}

export function buildFinanceAttention(
  input: FinanceAttentionInput
): AttentionItem[] {
  const items: AttentionItem[] = []

  if (input.collectionRateMTD !== null && input.collectionRateMTD < 0.5) {
    items.push({
      severity: 'warning',
      message: `Collection rate this month is ${Math.round(input.collectionRateMTD * 100)}% of billed`,
      href: '/reports/finance'
    })
  }

  if (input.ninetyPlusGrowthPct !== null && input.ninetyPlusGrowthPct > 15) {
    items.push({
      severity: 'critical',
      message: `The 90+ day overdue bucket grew ${Math.round(input.ninetyPlusGrowthPct)}% over last month`,
      href: '/fee-management?status=OVERDUE&age=90'
    })
  }

  if (input.concessionPctMTD !== null && input.concessionPctMTD > 0.1) {
    items.push({
      severity: 'warning',
      message: `Concessions are ${Math.round(input.concessionPctMTD * 100)}% of this month's billing`,
      href: '/fee-management?tab=concessions'
    })
  }

  return items
}

/** Median of a list of numbers; null for empty input. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}
