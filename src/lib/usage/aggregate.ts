import { prisma } from '@/lib/db'
import {
  normalizeFeature,
  moduleLabel,
  USAGE_MODULES,
  LICENSABLE_MODULE_SLUGS,
  DEFAULT_MINUTES_PER_ACTION,
  DEFAULT_HOURLY_RATE,
} from '@/lib/usage/modules'

export interface OrgUsageDetail {
  org: { id: string; name: string; status: string; institutionType: string }
  days: number
  summary: {
    healthScore: number
    subScores: { moduleAdoption: number; seatUtilization: number; recency: number }
    totalActiveHours: number
    totalActions: number
    activeUsers: number
    totalUsers: number
    activeDays: number
    hoursSaved: number
    costSavings: number
    hourlyRate: number
    periodSubscriptionCost: number
    roiMultiple: number | null
    enabledModules: number
    adoptedModules: number
  }
  modules: Array<{
    slug: string; label: string; actions: number; activeUsers: number; activeHours: number
    lastActive: Date | null; hoursSaved: number; costSavings: number
    licensable: boolean; enabled: boolean; adopted: boolean; underutilized: boolean
  }>
  users: Array<{ userId: string; name: string; actions: number; activeHours: number; lastActive: Date | null; topModule: string }>
  trend: Array<{ date: string; count: number }>
}

/** Compute the full per-org usage detail. Returns null when the org is missing. */
export async function getOrgUsageDetail(id: string, daysInput: number): Promise<OrgUsageDetail | null> {
  const days = Number.isFinite(daysInput) ? Math.min(Math.max(daysInput, 1), 365) : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [org, users, orgModules, settings, eventRows, heartbeatRows, lastByModule, lastByUser, activeDaysRow, trend] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true, name: true, status: true, institutionType: true,
          subscriptions: { where: { status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD', 'PAST_DUE'] } }, select: { amount: true, billingCycle: true }, take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.user.findMany({ where: { orgId: id, deletedAt: null }, select: { id: true, name: true, email: true } }),
      prisma.organizationModule.findMany({ where: { orgId: id, enabled: true }, select: { module: { select: { slug: true } } } }),
      prisma.platformSettings.findUnique({ where: { id: 'default' }, select: { usageHourlyRate: true, usageMinutesPerAction: true } }),
      prisma.$queryRaw<Array<{ feature: string; user_id: string | null; c: number }>>`
        SELECT "feature", "user_id", count(*)::int AS c FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since} GROUP BY 1, 2`,
      prisma.$queryRaw<Array<{ feature: string; user_id: string; mins: number }>>`
        SELECT "feature", "user_id", count(DISTINCT date_trunc('minute', "created_at"))::int AS mins
        FROM "platform"."usage_heartbeats" WHERE "org_id" = ${id} AND "created_at" >= ${since} GROUP BY 1, 2`,
      prisma.$queryRaw<Array<{ feature: string; last: Date }>>`
        SELECT "feature", max("created_at") AS last FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since} GROUP BY 1`,
      prisma.$queryRaw<Array<{ user_id: string | null; last: Date; c: number }>>`
        SELECT "user_id", max("created_at") AS last, count(*)::int AS c FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since} GROUP BY 1`,
      prisma.$queryRaw<Array<{ d: number }>>`
        SELECT count(DISTINCT date_trunc('day', "created_at"))::int AS d FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since}`,
      prisma.$queryRaw<Array<{ day: Date; c: number }>>`
        SELECT date_trunc('day', "created_at") AS day, count(*)::int AS c FROM "platform"."feature_usage_events"
        WHERE "org_id" = ${id} AND "created_at" >= ${since} GROUP BY 1 ORDER BY 1`,
    ])

  if (!org) return null

  const hourlyRate = settings?.usageHourlyRate ?? DEFAULT_HOURLY_RATE
  const minsModel: Record<string, number> = { ...DEFAULT_MINUTES_PER_ACTION, ...((settings?.usageMinutesPerAction as any) || {}) }

  const userName = new Map(users.map((u) => [u.id, u.name || u.email || 'User']))
  const totalUsers = users.length

  const enabledLicensable = new Set(
    orgModules.map((m) => normalizeFeature(m.module?.slug)).filter((s) => LICENSABLE_MODULE_SLUGS.has(s))
  )

  type Mod = { actions: number; minutes: number; users: Set<string>; lastActive: Date | null }
  const mod = new Map<string, Mod>()
  const getMod = (slug: string) => {
    let m = mod.get(slug)
    if (!m) { m = { actions: 0, minutes: 0, users: new Set(), lastActive: null }; mod.set(slug, m) }
    return m
  }
  const userAgg = new Map<string, { actions: number; minutes: number; lastActive: Date | null; perModuleActions: Record<string, number> }>()
  const getUser = (uid: string) => {
    let u = userAgg.get(uid)
    if (!u) { u = { actions: 0, minutes: 0, lastActive: null, perModuleActions: {} }; userAgg.set(uid, u) }
    return u
  }

  for (const row of eventRows) {
    const slug = normalizeFeature(row.feature)
    const m = getMod(slug); m.actions += row.c
    if (row.user_id) {
      m.users.add(row.user_id)
      const u = getUser(row.user_id); u.actions += row.c
      u.perModuleActions[slug] = (u.perModuleActions[slug] || 0) + row.c
    }
  }
  for (const row of heartbeatRows) {
    const slug = normalizeFeature(row.feature)
    const m = getMod(slug); m.minutes += row.mins; m.users.add(row.user_id)
    getUser(row.user_id).minutes += row.mins
  }
  for (const row of lastByModule) getMod(normalizeFeature(row.feature)).lastActive = row.last
  for (const row of lastByUser) if (row.user_id) getUser(row.user_id).lastActive = row.last

  const modules = USAGE_MODULES
    .filter((def) => def.slug !== 'other' || mod.get('other'))
    .map((def) => {
      const m = mod.get(def.slug)
      const actions = m?.actions ?? 0
      const minutes = m?.minutes ?? 0
      const enabled = enabledLicensable.has(def.slug) || !LICENSABLE_MODULE_SLUGS.has(def.slug)
      const adopted = actions > 0 || minutes > 0
      const minutesSaved = actions * (minsModel[def.slug] ?? 2)
      return {
        slug: def.slug, label: def.label, actions,
        activeUsers: m?.users.size ?? 0,
        activeHours: Math.round((minutes / 60) * 10) / 10,
        lastActive: m?.lastActive ?? null,
        hoursSaved: Math.round((minutesSaved / 60) * 10) / 10,
        costSavings: Math.round((minutesSaved / 60) * hourlyRate),
        licensable: LICENSABLE_MODULE_SLUGS.has(def.slug),
        enabled, adopted,
        underutilized: LICENSABLE_MODULE_SLUGS.has(def.slug) && enabledLicensable.has(def.slug) && !adopted,
      }
    })
    .sort((a, b) => b.actions + b.activeHours - (a.actions + a.activeHours))

  const perUser = Array.from(userAgg.entries()).map(([uid, u]) => {
    const topModule = Object.entries(u.perModuleActions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return {
      userId: uid, name: userName.get(uid) || 'Unknown user', actions: u.actions,
      activeHours: Math.round((u.minutes / 60) * 10) / 10, lastActive: u.lastActive,
      topModule: topModule ? moduleLabel(topModule) : '—',
    }
  }).sort((a, b) => b.activeHours + b.actions / 100 - (a.activeHours + a.actions / 100))

  const totalMinutes = heartbeatRows.reduce((s, r) => s + r.mins, 0)
  const totalActions = eventRows.reduce((s, r) => s + r.c, 0)
  const totalHoursSaved = modules.reduce((s, m) => s + m.hoursSaved, 0)
  const totalCostSavings = modules.reduce((s, m) => s + m.costSavings, 0)
  const activeUserIds = new Set<string>()
  eventRows.forEach((r) => r.user_id && activeUserIds.add(r.user_id))
  heartbeatRows.forEach((r) => activeUserIds.add(r.user_id))
  const activeUsers = activeUserIds.size
  const activeDays = activeDaysRow[0]?.d ?? 0

  const adoptedLicensable = modules.filter((m) => m.licensable && enabledLicensable.has(m.slug) && m.adopted).length
  const moduleAdoption = enabledLicensable.size > 0 ? adoptedLicensable / enabledLicensable.size : (adoptedLicensable > 0 ? 1 : 0)
  const seatUtilization = totalUsers > 0 ? Math.min(1, activeUsers / totalUsers) : 0
  const recency = Math.min(1, activeDays / days)
  const healthScore = Math.round(100 * (0.4 * moduleAdoption + 0.3 * seatUtilization + 0.3 * recency))

  const sub = org.subscriptions[0]
  let periodSubscriptionCost = 0
  if (sub) {
    const amt = Number(sub.amount)
    const monthly = sub.billingCycle === 'ANNUAL' ? amt / 12 : sub.billingCycle === 'QUARTERLY' ? amt / 3 : amt
    periodSubscriptionCost = Math.round(monthly * (days / 30))
  }
  const roiMultiple = periodSubscriptionCost > 0 ? Math.round((totalCostSavings / periodSubscriptionCost) * 10) / 10 : null

  return {
    org: { id: org.id, name: org.name, status: org.status, institutionType: org.institutionType },
    days,
    summary: {
      healthScore,
      subScores: {
        moduleAdoption: Math.round(moduleAdoption * 100),
        seatUtilization: Math.round(seatUtilization * 100),
        recency: Math.round(recency * 100),
      },
      totalActiveHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalActions, activeUsers, totalUsers, activeDays,
      hoursSaved: Math.round(totalHoursSaved * 10) / 10,
      costSavings: totalCostSavings, hourlyRate, periodSubscriptionCost, roiMultiple,
      enabledModules: enabledLicensable.size, adoptedModules: adoptedLicensable,
    },
    modules,
    users: perUser,
    trend: trend.map((t) => ({ date: t.day.toISOString().slice(0, 10), count: t.c })),
  }
}
