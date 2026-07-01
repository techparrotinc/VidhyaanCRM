import { redis } from '@/lib/redis'

export const REVOCATION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export async function isUserRevoked(userId: string): Promise<boolean> {
  const result = await redis.get(`roleauth:${userId}`)
  return !!result
}

export async function revokeUser(userId: string): Promise<void> {
  await redis.set(`roleauth:${userId}`, '1', 'EX', REVOCATION_TTL_SECONDS)
}

export async function clearUserRevocation(userId: string): Promise<void> {
  await redis.del(`roleauth:${userId}`)
}

export async function isAssignmentRevoked(
  userId: string,
  assignmentId: string | null | undefined
): Promise<boolean> {
  if (!assignmentId) return false
  const result = await redis.get(`roleauth:${userId}:${assignmentId}`)
  return !!result
}

// Called by future assignment-specific revoke endpoints
export async function revokeAssignment(userId: string, assignmentId: string): Promise<void> {
  await redis.set(`roleauth:${userId}:${assignmentId}`, '1', 'EX', REVOCATION_TTL_SECONDS)
}
