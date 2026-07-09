import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export const SLAB_CAPACITY: Record<string, number> = {
  S50: 50,
  S100: 100,
  S200: 200,
  S500: 500,
  S500_PLUS: Number.MAX_SAFE_INTEGER
}

export const DEFAULT_FREE_AI_ALLOWANCE = 25

/**
 * Sets the org's monthly AI credit allowance to the amount bundled with the
 * slab it paid for (Enterprise: 100–500/mo). The wallet's lazy monthly reset
 * re-issues this allowance every month. Purchased credits are untouched.
 */
export async function syncBundledAiAllowance(orgId: string, planId: string, slab?: string | null): Promise<void> {
  let allowance = DEFAULT_FREE_AI_ALLOWANCE
  if (slab) {
    const price = await prisma.planPrice.findUnique({
      where: { planId_slab: { planId, slab: slab as any } },
      select: { bundledAiCredits: true }
    })
    if (price && price.bundledAiCredits > 0) allowance = price.bundledAiCredits
  }
  await prisma.messageWallet.upsert({
    where: { orgId_channel: { orgId, channel: 'AI' } },
    update: { freeAllowance: allowance },
    create: { orgId, channel: 'AI', freeAllowance: allowance }
  })
}

/** Remap an org's modules to exactly the given plan's module set. */
export async function remapOrgModulesToPlan(orgId: string, planId: string): Promise<string[]> {
  const [planModules, allModules] = await Promise.all([
    prisma.planModule.findMany({ where: { planId }, select: { moduleSlug: true } }),
    prisma.module.findMany({ select: { id: true, slug: true } })
  ])
  const planSlugs = new Set(planModules.map((pm) => pm.moduleSlug))
  for (const mod of allModules) {
    const shouldEnable = planSlugs.has(mod.slug)
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId, moduleId: mod.id } },
      update: shouldEnable
        ? { enabled: true, enabledAt: new Date(), disabledAt: null }
        : { enabled: false, disabledAt: new Date() },
      create: shouldEnable
        ? { orgId, moduleId: mod.id, enabled: true, enabledAt: new Date() }
        : { orgId, moduleId: mod.id, enabled: false, disabledAt: new Date() }
    })
  }
  try {
    await redis.del(`org:${orgId}`)
    await Promise.all(allModules.map((m) => redis.del(`org:${orgId}:module:${m.slug}`)))
  } catch (e) {
    console.error('module remap cache bust failed:', e)
  }
  return allModules.filter((m) => planSlugs.has(m.slug)).map((m) => m.slug)
}

/**
 * Downgrades an org to the free listing plan: subscription EXPIRED, plan set
 * to free, modules locked to the free plan's set. Data is retained.
 */
export async function downgradeOrgToFree(orgId: string, reason: string): Promise<void> {
  const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
  if (!freePlan) throw new Error('free plan missing')

  const sub = await prisma.subscription.findFirst({ where: { orgId, deletedAt: null } })
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED', cancelAtPeriodEnd: false, graceEndsAt: null }
    })
  }
  await prisma.organization.update({
    where: { id: orgId },
    // Back to a plain free-listing org: full access to free features, no
    // lingering TRIAL/GRACE status or trial dates.
    data: {
      planId: freePlan.id,
      leadCap: freePlan.leadCap ?? 10,
      status: 'ACTIVE',
      trialEndsAt: null,
    }
  })
  await remapOrgModulesToPlan(orgId, freePlan.id)
  // Bundled AI allowance ends with the paid plan
  await prisma.messageWallet.updateMany({
    where: { orgId, channel: 'AI' },
    data: { freeAllowance: DEFAULT_FREE_AI_ALLOWANCE }
  })

  await prisma.auditLog
    .create({
      data: {
        orgId,
        action: 'UPDATE',
        entityType: 'SUBSCRIPTION',
        entityId: sub?.id ?? orgId,
        after: { status: 'EXPIRED', downgradedTo: 'free', reason }
      }
    })
    .catch((e) => console.error('downgrade audit failed:', e))
}
