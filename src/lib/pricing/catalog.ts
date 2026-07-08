// Vidhyaan pricing catalog — slab-based plan pricing + financial model defaults.
// Source of truth: docs/pricing-strategy-2026.md (§8, §10, §11).
// Strategy: aggressive SMB entry (launch offer on lowest slabs), "starting at"
// pricing on 500+ slabs with per-student overage, custom quote above 1,000.

export type SlabKey = 'S50' | 'S100' | 'S200' | 'S500' | 'S500_PLUS'

export const SLABS: { key: SlabKey; label: string; midpoint: number }[] = [
  { key: 'S50', label: 'Up to 50', midpoint: 35 },
  { key: 'S100', label: '51–100', midpoint: 75 },
  { key: 'S200', label: '101–200', midpoint: 150 },
  { key: 'S500', label: '201–500', midpoint: 350 },
  { key: 'S500_PLUS', label: '500+ (starting at)', midpoint: 750 },
]

export function slabForStudents(count: number): SlabKey {
  if (count <= 50) return 'S50'
  if (count <= 100) return 'S100'
  if (count <= 200) return 'S200'
  if (count <= 500) return 'S500'
  return 'S500_PLUS'
}

export interface SlabPrice {
  monthly: number // list price ₹/mo, excl. GST
  launchMonthly?: number // aggressive SMB launch offer (invoiced price)
  bundledAiCredits?: number
}

export interface PlanCatalogEntry {
  slug: string
  name: string
  flagship?: boolean
  slabs: Record<SlabKey, SlabPrice>
}

// Annual = pay for 10 months (16.7% off) — applied on the invoiced price.
export const ANNUAL_MONTHS = 10

// 500+ slabs are "starting at" prices covering up to 1,000 students;
// beyond the slab base, bill per extra student. Above 1,000 → custom quote.
// Keys are billing.plans slugs (slugs never change; display names live in DB).
export const OVERAGE_PER_STUDENT: Record<string, number> = {
  starter: 5,
  growth: 7,
  enterprise: 10,
}
export const CUSTOM_QUOTE_ABOVE_STUDENTS = 1000

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    slug: 'starter',
    name: 'CRM Package',
    slabs: {
      S50: { monthly: 1199, launchMonthly: 999 },
      S100: { monthly: 1499 },
      S200: { monthly: 2499 },
      S500: { monthly: 3999 },
      S500_PLUS: { monthly: 5999 },
    },
  },
  {
    slug: 'growth',
    name: 'Fee Management',
    slabs: {
      S50: { monthly: 1499, launchMonthly: 1199 },
      S100: { monthly: 1799 },
      S200: { monthly: 2999 },
      S500: { monthly: 4999 },
      S500_PLUS: { monthly: 7499 },
    },
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    flagship: true,
    slabs: {
      // List ₹2,499 anchors credibility; ₹1,999 launch offer keeps SMB entry aggressive.
      S50: { monthly: 2499, launchMonthly: 1999, bundledAiCredits: 100 },
      S100: { monthly: 2999, bundledAiCredits: 150 },
      S200: { monthly: 4999, bundledAiCredits: 200 },
      S500: { monthly: 7999, bundledAiCredits: 300 },
      S500_PLUS: { monthly: 11999, bundledAiCredits: 500 },
    },
  },
]

// Direct COGS per org/mo by slab (infra share; §4) — gateway 2% added on price.
export const SLAB_INFRA_COGS: Record<SlabKey, number> = {
  S50: 150,
  S100: 220,
  S200: 320,
  S500: 550,
  S500_PLUS: 900,
}
export const AI_CREDIT_COST = 0.2 // ₹ per credit, hosted-OSS weighted (§11)
export const GATEWAY_PCT = 0.02

export function grossMarginPct(price: number, slab: SlabKey, aiCredits = 0): number {
  const cogs = SLAB_INFRA_COGS[slab] + aiCredits * AI_CREDIT_COST + price * GATEWAY_PCT
  return ((price - cogs) / price) * 100
}

// ---------------------------------------------------------------------------
// Financial model — projection scenarios (docs §12, revised bootstrap inputs)

export interface CostStage {
  customers: number
  opsPerMonth: number // salaries + marketing + overhead
  infraPerMonth: number // platform-wide infra
}

export interface Scenario {
  key: string
  name: string
  description: string
  arpu: number // blended ₹/customer/mo (subscription + add-ons)
  addonCogsPerCustomer: number // messaging/AI/gateway variable cost ₹/customer/mo
  stages: CostStage[]
}

export const SCENARIOS: Scenario[] = [
  {
    key: 'bootstrap',
    name: 'Year 1 — Bootstrap',
    description:
      'Free tiers: Vercel Hobby→Pro, Neon $1,000 credit, S3/CDN free, email ₹150. Team: 2 founders + 2 employees at ₹1L total.',
    arpu: 4300,
    addonCogsPerCustomer: 400,
    stages: [
      { customers: 10, opsPerMonth: 100000, infraPerMonth: 2000 },
      { customers: 25, opsPerMonth: 100000, infraPerMonth: 2500 },
      { customers: 50, opsPerMonth: 122000, infraPerMonth: 4000 },
      { customers: 100, opsPerMonth: 144000, infraPerMonth: 8000 },
      { customers: 250, opsPerMonth: 300000, infraPerMonth: 30000 },
      { customers: 500, opsPerMonth: 550000, infraPerMonth: 60000 },
      { customers: 1000, opsPerMonth: 1000000, infraPerMonth: 120000 },
    ],
  },
  {
    key: 'steady',
    name: 'Year 2+ — Steady State',
    description:
      'Paid infra (Neon always-on, Vercel Pro), fully staffed ops per growth stage. Matches board doc §12.',
    arpu: 4300,
    addonCogsPerCustomer: 550,
    stages: [
      { customers: 10, opsPerMonth: 150000, infraPerMonth: 12400 },
      { customers: 25, opsPerMonth: 200000, infraPerMonth: 15500 },
      { customers: 50, opsPerMonth: 300000, infraPerMonth: 20000 },
      { customers: 100, opsPerMonth: 450000, infraPerMonth: 28500 },
      { customers: 250, opsPerMonth: 750000, infraPerMonth: 50000 },
      { customers: 500, opsPerMonth: 1300000, infraPerMonth: 83000 },
      { customers: 1000, opsPerMonth: 2200000, infraPerMonth: 148000 },
    ],
  },
]

export interface ProjectionRow {
  customers: number
  mrr: number
  arr: number
  cogs: number
  ops: number
  grossProfit: number
  netProfit: number
  netMarginPct: number
}

export function projectStage(stage: CostStage, arpu: number, addonCogs: number): ProjectionRow {
  const mrr = stage.customers * arpu
  const cogs = stage.infraPerMonth + stage.customers * addonCogs
  const grossProfit = mrr - cogs
  const netProfit = grossProfit - stage.opsPerMonth
  return {
    customers: stage.customers,
    mrr,
    arr: mrr * 12,
    cogs,
    ops: stage.opsPerMonth,
    grossProfit,
    netProfit,
    netMarginPct: mrr > 0 ? (netProfit / mrr) * 100 : 0,
  }
}

// Break-even customer count: interpolate where net profit crosses zero.
export function breakEvenCustomers(scenario: Scenario, arpu: number, addonCogs: number): number | null {
  let prev: ProjectionRow | null = null
  for (const stage of scenario.stages) {
    const row = projectStage(stage, arpu, addonCogs)
    if (row.netProfit >= 0) {
      if (!prev) return row.customers
      const span = row.netProfit - prev.netProfit
      if (span <= 0) return row.customers
      const t = -prev.netProfit / span
      return Math.round(prev.customers + t * (row.customers - prev.customers))
    }
    prev = row
  }
  return null
}
