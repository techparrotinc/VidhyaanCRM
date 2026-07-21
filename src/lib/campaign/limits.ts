// Single source of truth for campaign send limits (docs/campaign-enhancement-plan-2026-07.md §1).
//
// EMAIL is part of the base plan → scales by plan tier. Two ceilings apply,
// whichever is hit first blocks:
//   - MONTHLY quota: the real per-plan allowance (billing framing).
//   - DAILY cap: a low anti-spike valve protecting the SHARED sending domain
//     (send.vidhyaan.com) reputation — never overshoots the monthly quota.
//
// SMS + WhatsApp are PAID ADD-ONS available on any plan → the credit wallet is
// the real limit. The daily cap here is a flat safety valve only (fat-finger
// blasts, DLT/Meta abuse flags, wallet drain) — same for every plan.

export type PlanSlug = 'free' | 'starter' | 'growth' | 'enterprise'

function normalizePlan(slug: string | null | undefined): PlanSlug {
  const s = (slug ?? 'starter').toLowerCase()
  if (s === 'free' || s === 'starter' || s === 'growth' || s === 'enterprise') return s
  return 'starter'
}

// EMAIL monthly quota (real ceiling). Enterprise is effectively unlimited.
const EMAIL_MONTHLY: Record<PlanSlug, number> = {
  free: 0,
  starter: 500,
  growth: 5000,
  enterprise: Number.POSITIVE_INFINITY,
}

// EMAIL daily anti-spike cap (protects shared-domain reputation).
const EMAIL_DAILY: Record<PlanSlug, number> = {
  free: 0,
  starter: 50,
  growth: 100,
  enterprise: 500,
}

// Flat daily safety cap for SMS/WhatsApp add-on sends (wallet is the real limit).
export const ADDON_DAILY_CAP = 1000

export function emailMonthlyLimit(planSlug: string | null | undefined): number {
  return EMAIL_MONTHLY[normalizePlan(planSlug)]
}

export function emailDailyLimit(planSlug: string | null | undefined): number {
  return EMAIL_DAILY[normalizePlan(planSlug)]
}

/** UTC instant of the most recent IST (Asia/Kolkata, UTC+5:30) midnight —
 *  matches the IST-day convention used by report rollups. */
export function startOfDayIST(now: Date = new Date()): Date {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  const istMidnightMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  return new Date(istMidnightMs - IST_OFFSET_MS)
}
