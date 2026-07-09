import { prisma } from '@/lib/db'

/**
 * Roll up one UTC day of raw usage into platform.usage_daily_rollups.
 * Idempotent: re-running the same day upserts. Aggregates actions +
 * active-users from feature_usage_events and active-minutes from
 * usage_heartbeats, keyed on (org, day, feature).
 */
export async function rollupUsageDay(day: Date): Promise<number> {
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()))
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  const [events, heartbeats] = await Promise.all([
    prisma.$queryRaw<Array<{ org_id: string; feature: string; actions: number; users: number }>>`
      SELECT "org_id", "feature", count(*)::int AS actions, count(DISTINCT "user_id")::int AS users
      FROM "platform"."feature_usage_events"
      WHERE "created_at" >= ${start} AND "created_at" < ${end}
      GROUP BY 1, 2`,
    prisma.$queryRaw<Array<{ org_id: string; feature: string; mins: number }>>`
      SELECT "org_id", "feature", count(DISTINCT ("user_id", date_trunc('minute', "created_at")))::int AS mins
      FROM "platform"."usage_heartbeats"
      WHERE "created_at" >= ${start} AND "created_at" < ${end}
      GROUP BY 1, 2`,
  ])

  // Merge the two signals by (org, feature)
  type Agg = { actions: number; users: number; mins: number }
  const map = new Map<string, Agg>()
  const key = (o: string, f: string) => `${o}|${f}`
  for (const e of events) map.set(key(e.org_id, e.feature), { actions: e.actions, users: e.users, mins: 0 })
  for (const h of heartbeats) {
    const k = key(h.org_id, h.feature)
    const cur = map.get(k) || { actions: 0, users: 0, mins: 0 }
    cur.mins = h.mins
    map.set(k, cur)
  }

  const dayOnly = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()))
  let written = 0
  for (const [k, v] of map) {
    const [orgId, feature] = k.split('|')
    await prisma.usageDailyRollup.upsert({
      where: { orgId_day_feature: { orgId, day: dayOnly, feature } },
      create: { orgId, day: dayOnly, feature, actions: v.actions, activeUsers: v.users, activeMinutes: v.mins },
      update: { actions: v.actions, activeUsers: v.users, activeMinutes: v.mins },
    })
    written++
  }
  return written
}

/**
 * Delete raw usage rows older than the retention window. Rollups preserve the
 * long-range history, so dashboards (≤90d windows) are unaffected.
 */
export async function pruneRawUsage(retentionDays: number): Promise<{ events: number; heartbeats: number }> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const [events, heartbeats] = await Promise.all([
    prisma.featureUsageEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.usageHeartbeat.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ])
  return { events: events.count, heartbeats: heartbeats.count }
}
