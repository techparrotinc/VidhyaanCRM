import { prisma } from '@/lib/db/client'
import { redis } from '@/lib/redis'

/**
 * Drop every cached dashboard summary for an org (one key per academic
 * year + the unscoped key). Call after mutations that must show on the
 * dashboard immediately — e.g. publishing an event.
 */
export async function invalidateDashboardCache(orgId: string): Promise<void> {
  try {
    const years = await prisma.academicYear.findMany({
      where: { orgId },
      select: { id: true }
    })
    const keys = [
      `dashboard:summary:${orgId}:all`,
      ...years.map((y) => `dashboard:summary:${orgId}:${y.id}`)
    ]
    await Promise.all(keys.map((k) => redis.del(k)))
  } catch (err) {
    console.error('Dashboard cache invalidation failed:', err)
  }
}
