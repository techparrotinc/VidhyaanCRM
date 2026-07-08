import { redis } from '@/lib/redis'

/** Invalidate the compose.ts branch-validation cache after branch CRUD. */
export async function bustBranchCaches(orgId: string) {
  try {
    await redis.del(`org:${orgId}:branch-ids`)
  } catch (err) {
    console.error('Branch cache bust:', err)
  }
}
