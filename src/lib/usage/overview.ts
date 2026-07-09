import { prisma } from '@/lib/db'
import {
  normalizeFeature,
  LICENSABLE_MODULE_SLUGS,
  DEFAULT_MINUTES_PER_ACTION,
  DEFAULT_HOURLY_RATE,
} from '@/lib/usage/modules'

export interface OverviewRow {
  orgId: string
  name: string
  status: string
  institutionType: string
  planName: string
  planSlug: string
  trialEndsAt: string | null
  healthScore: number
  adoptionPct: number
  seatPct: number
  activeUsers: number
  totalUsers: number
  enabledModules: number
  adoptedModules: number
  activeHours: number
  actions: number
  costSavings: number
  lastActive: string | null
  atRisk: boolean
  signals: string[]
}

export interface UsageOverview {
  days: number
  totals: {
    orgs: number
    trackedOrgs: number
    atRisk: number
    avgHealth: number
    totalActiveHours: number
    totalCostSavings: number
  }
  rows: OverviewRow[]
}

/**
 * Platform-wide usage & health snapshot for every org. Uses a fixed set of
 * GROUP BY org_id aggregations (independent of org count) joined in memory —
 * NOT a per-org call — so it stays cheap across the whole platform.
 */
export async function getUsageOverview(daysInput: number): Promise<UsageOverview> {
  const days = Number.isFinite(daysInput) ? Math.min(Math.max(daysInput, 1), 365) : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const now = new Date()

  const [orgs, userCounts, enabledModuleRows, settings, evByOrgFeature, evByOrg, hbByOrgUser, lastByOrg] =
    await Promise.all([
      prisma.organization.findMany({
        where: { deletedAt: null },
        select: {
          id: true, name: true, status: true, institutionType: true, trialEndsAt: true,
          plan: { select: { name: true, slug: true } },
        },
      }),
      prisma.user.groupBy({ by: ['orgId'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.organizationModule.findMany({ where: { enabled: true }, select: { orgId: true, module: { select: { slug: true } } } }),
      prisma.platformSettings.findUnique({ where: { id: 'default' }, select: { usageHourlyRate: true, usageMinutesPerAction: true } }),
      prisma.$queryRaw<Array<{ org_id: string; feature: string; c: number }>>`
        SELECT "org_id", "feature", count(*)::int AS c FROM "platform"."feature_usage_events"
        WHERE "created_at" >= ${since} GROUP BY 1, 2`,
      prisma.$queryRaw<Array<{ org_id: string; users: number; days: number }>>`
        SELECT "org_id", count(DISTINCT "user_id")::int AS users, count(DISTINCT date_trunc('day', "created_at"))::int AS days
        FROM "platform"."feature_usage_events" WHERE "created_at" >= ${since} GROUP BY 1`,
      prisma.$queryRaw<Array<{ org_id: string; user_id: string; mins: number }>>`
        SELECT "org_id", "user_id", count(DISTINCT date_trunc('minute', "created_at"))::int AS mins
        FROM "platform"."usage_heartbeats" WHERE "created_at" >= ${since} GROUP BY 1, 2`,
      prisma.$queryRaw<Array<{ org_id: string; last: Date }>>`
        SELECT "org_id", max("created_at") AS last FROM "platform"."feature_usage_events"
        WHERE "created_at" >= ${since} GROUP BY 1`,
    ])

  const hourlyRate = settings?.usageHourlyRate ?? DEFAULT_HOURLY_RATE
  const minsModel: Record<string, number> = { ...DEFAULT_MINUTES_PER_ACTION, ...((settings?.usageMinutesPerAction as any) || {}) }

  const totalUsersByOrg = new Map(userCounts.map((u) => [u.orgId, u._count._all]))

  // enabled licensable modules per org
  const enabledByOrg = new Map<string, Set<string>>()
  for (const r of enabledModuleRows) {
    const slug = normalizeFeature(r.module?.slug)
    if (!LICENSABLE_MODULE_SLUGS.has(slug)) continue
    if (!enabledByOrg.has(r.orgId)) enabledByOrg.set(r.orgId, new Set())
    enabledByOrg.get(r.orgId)!.add(slug)
  }

  // per-org actions, adopted modules, cost savings (from events)
  const actionsByOrg = new Map<string, number>()
  const adoptedByOrg = new Map<string, Set<string>>()
  const savingsByOrg = new Map<string, number>()
  for (const r of evByOrgFeature) {
    const slug = normalizeFeature(r.feature)
    actionsByOrg.set(r.org_id, (actionsByOrg.get(r.org_id) || 0) + r.c)
    if (!adoptedByOrg.has(r.org_id)) adoptedByOrg.set(r.org_id, new Set())
    adoptedByOrg.get(r.org_id)!.add(slug)
    const savedMin = r.c * (minsModel[slug] ?? 2)
    savingsByOrg.set(r.org_id, (savingsByOrg.get(r.org_id) || 0) + savedMin)
  }

  const evMeta = new Map(evByOrg.map((r) => [r.org_id, { users: r.users, days: r.days }]))
  const lastMap = new Map(lastByOrg.map((r) => [r.org_id, r.last]))

  // heartbeat minutes + active users per org (sum of per-user distinct minutes)
  const hbMinsByOrg = new Map<string, number>()
  const hbUsersByOrg = new Map<string, Set<string>>()
  for (const r of hbByOrgUser) {
    hbMinsByOrg.set(r.org_id, (hbMinsByOrg.get(r.org_id) || 0) + r.mins)
    if (!hbUsersByOrg.has(r.org_id)) hbUsersByOrg.set(r.org_id, new Set())
    hbUsersByOrg.get(r.org_id)!.add(r.user_id)
  }

  const rows: OverviewRow[] = orgs.map((o) => {
    const totalUsers = totalUsersByOrg.get(o.id) ?? 0
    const enabled = enabledByOrg.get(o.id) ?? new Set<string>()
    const adopted = adoptedByOrg.get(o.id) ?? new Set<string>()
    const adoptedLicensable = [...adopted].filter((s) => enabled.has(s)).length
    const moduleAdoption = enabled.size > 0 ? adoptedLicensable / enabled.size : (adoptedLicensable > 0 ? 1 : 0)

    const evUsers = evMeta.get(o.id)?.users ?? 0
    const hbUsers = hbUsersByOrg.get(o.id)?.size ?? 0
    const activeUsers = Math.max(evUsers, hbUsers)
    const seat = totalUsers > 0 ? Math.min(1, activeUsers / totalUsers) : 0

    const activeDays = evMeta.get(o.id)?.days ?? 0
    const recency = Math.min(1, activeDays / days)

    const healthScore = Math.round(100 * (0.4 * moduleAdoption + 0.3 * seat + 0.3 * recency))
    const actions = actionsByOrg.get(o.id) ?? 0
    const activeHours = Math.round(((hbMinsByOrg.get(o.id) ?? 0) / 60) * 10) / 10
    const costSavings = Math.round(((savingsByOrg.get(o.id) ?? 0) / 60) * hourlyRate)
    const lastActive = lastMap.get(o.id) ?? null

    // churn / risk signals
    const signals: string[] = []
    const trialDays = o.trialEndsAt ? Math.ceil((new Date(o.trialEndsAt).getTime() - now.getTime()) / 86400000) : null
    if (actions === 0 && activeHours === 0) signals.push('No activity')
    if (enabled.size > 0 && adoptedLicensable === 0) signals.push('Modules unused')
    if (o.status === 'TRIAL' && trialDays !== null && trialDays <= 7 && healthScore < 50) signals.push('Trial ending, low use')
    if (totalUsers > 0 && seat < 0.34 && totalUsers >= 3) signals.push('Low seat use')
    const atRisk = healthScore < 40 || signals.length > 0

    return {
      orgId: o.id, name: o.name, status: o.status, institutionType: o.institutionType,
      planName: o.plan?.name || 'Free', planSlug: o.plan?.slug || 'free',
      trialEndsAt: o.trialEndsAt ? o.trialEndsAt.toISOString() : null,
      healthScore,
      adoptionPct: Math.round(moduleAdoption * 100),
      seatPct: Math.round(seat * 100),
      activeUsers, totalUsers,
      enabledModules: enabled.size, adoptedModules: adoptedLicensable,
      activeHours, actions, costSavings,
      lastActive: lastActive ? lastActive.toISOString() : null,
      atRisk, signals,
    }
  })

  const tracked = rows.filter((r) => r.actions > 0 || r.activeHours > 0)
  const totals = {
    orgs: rows.length,
    trackedOrgs: tracked.length,
    atRisk: rows.filter((r) => r.atRisk).length,
    avgHealth: tracked.length > 0 ? Math.round(tracked.reduce((s, r) => s + r.healthScore, 0) / tracked.length) : 0,
    totalActiveHours: Math.round(rows.reduce((s, r) => s + r.activeHours, 0) * 10) / 10,
    totalCostSavings: rows.reduce((s, r) => s + r.costSavings, 0),
  }

  // Default order: worst health first (surfaces churn risk), but active orgs before dead ones.
  rows.sort((a, b) => {
    const aTracked = a.actions + a.activeHours > 0 ? 1 : 0
    const bTracked = b.actions + b.activeHours > 0 ? 1 : 0
    if (aTracked !== bTracked) return bTracked - aTracked
    return a.healthScore - b.healthScore
  })

  return { days, totals, rows }
}
