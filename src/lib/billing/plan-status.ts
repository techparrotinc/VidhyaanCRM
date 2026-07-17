// Single source of truth for "is this org on a paid plan?" — used to gate
// upgrade prompts consistently (dashboard, lead list, etc.). A finite lead cap
// on a paid plan must NOT be mistaken for "free/limited".

export interface OrgPlanish {
  status?: string | null
  plan?: { slug?: string | null; monthlyPrice?: unknown } | null
}

export function isPaidPlan(org: OrgPlanish | null | undefined): boolean {
  const slug = org?.plan?.slug ?? 'free'
  return org?.status === 'ACTIVE' && slug !== 'free' && Number(org?.plan?.monthlyPrice ?? 0) > 0
}

/**
 * True when a free-tier org is currently at/over its leadCap. Re-checked at
 * the moment of the call, not read from a stale `queued` flag on a lead row
 * — an org that's since upgraded (or had its cap raised) should stop
 * blocking immediately, not until every queued lead is somehow re-created.
 */
export async function isOverLeadCap(
  db: any,
  orgId: string,
  org: OrgPlanish & { leadCap?: number | null }
): Promise<boolean> {
  if (isPaidPlan(org) || org.leadCap == null) return false
  const leadCount = await db.lead.count({ where: { orgId } })
  return leadCount >= org.leadCap
}
