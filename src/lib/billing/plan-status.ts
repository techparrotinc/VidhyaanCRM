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
