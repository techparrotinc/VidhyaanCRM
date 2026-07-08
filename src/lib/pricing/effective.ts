import { prisma } from '@/lib/db'
import { SLABS, slabForStudents, type SlabKey } from '@/lib/pricing/catalog'
import { applyPercentOff } from '@/lib/billing/money'

const slabIndex = (slab: SlabKey) => SLABS.findIndex((s) => s.key === slab)

export interface EffectivePricing {
  slab: SlabKey
  detectedSlab: SlabKey
  studentCount: number
  monthly: number // effective (launch offer if present)
  listMonthly: number
  launchMonthly: number | null
  annual: number
  bundledAiCredits: number
  overagePerStudent: number | null
  hasSlabPricing: boolean
}

/**
 * Effective slab price for a plan and org. The minimum slab is derived
 * server-side from the org's active student count; a caller may request a
 * LARGER slab (e.g. buying headroom for expected admissions) but never a
 * smaller one. Falls back to the plan's base monthly/annual price when the
 * plan has no slab rows (free plan).
 */
export async function getEffectivePricing(
  planId: string,
  orgId: string,
  requestedSlab?: SlabKey | null
): Promise<EffectivePricing> {
  const [studentCount, plan, orgRow] = await Promise.all([
    prisma.student.count({ where: { orgId, deletedAt: null } }),
    prisma.plan.findUniqueOrThrow({
      where: { id: planId },
      include: { planPrices: true }
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } })
  ])

  // Admin-negotiated per-org discount, capped at 50% (floor-price guard)
  const rawDiscount = Number(((orgRow?.settings as any) || {}).billingDiscountPct) || 0
  const discountPct = Math.min(50, Math.max(0, rawDiscount))
  const applyDiscount = (v: number) => applyPercentOff(v, discountPct)

  const detectedSlab = slabForStudents(studentCount)
  const slab =
    requestedSlab && slabIndex(requestedSlab) >= slabIndex(detectedSlab)
      ? requestedSlab
      : detectedSlab
  const slabPrice = plan.planPrices.find((pp) => pp.slab === slab)

  if (!slabPrice) {
    const monthly = Number(plan.monthlyPrice)
    return {
      slab,
      detectedSlab,
      studentCount,
      monthly: applyDiscount(monthly),
      listMonthly: monthly,
      launchMonthly: null,
      annual: applyDiscount(plan.annualPrice ? Number(plan.annualPrice) : monthly * 10),
      bundledAiCredits: 0,
      overagePerStudent: null,
      hasSlabPricing: false
    }
  }

  const listMonthly = Number(slabPrice.monthlyPrice)
  // Launch offers expire automatically once launchEndsAt passes
  const launchActive =
    slabPrice.launchMonthly != null &&
    (!slabPrice.launchEndsAt || slabPrice.launchEndsAt > new Date())
  const launchMonthly = launchActive ? Number(slabPrice.launchMonthly) : null
  const monthly = launchMonthly ?? listMonthly
  // Annual keeps the pay-for-10-months structure on the effective monthly price.
  const annual = launchMonthly ? launchMonthly * 10 : Number(slabPrice.annualPrice)

  return {
    slab,
    detectedSlab,
    studentCount,
    monthly: applyDiscount(monthly),
    listMonthly,
    launchMonthly,
    annual: applyDiscount(annual),
    bundledAiCredits: slabPrice.bundledAiCredits,
    overagePerStudent: slabPrice.overagePerStudent ? Number(slabPrice.overagePerStudent) : null,
    hasSlabPricing: true
  }
}

/** Price for a billing cycle from effective pricing (quarterly = 3× monthly). */
export function priceForCycle(pricing: EffectivePricing, cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'): number {
  if (cycle === 'ANNUAL') return pricing.annual
  if (cycle === 'QUARTERLY') return pricing.monthly * 3
  return pricing.monthly
}
