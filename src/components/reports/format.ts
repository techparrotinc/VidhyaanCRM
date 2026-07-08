// Indian-format currency + number helpers for report surfaces.

export function formatINR(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`
  if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)}k`
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatINRFull(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatPct(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined) return '—'
  return `${(fraction * 100).toFixed(1)}%`
}

/** Signed delta vs previous value, as percent. Null when no base. */
export function deltaPct(current: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null
  return (current - prev) / prev
}

export function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}
