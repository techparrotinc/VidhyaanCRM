import { redis } from './redis'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // seconds remaining until reset
}

/**
 * otpSendLimiter
 * Redis-based rate limiter to enforce:
 * - 3 sends per 15 minutes.
 */
export async function otpSendLimiter(key: string): Promise<RateLimitResult> {
  return windowLimiter(key, 3, 15 * 60)
}

/**
 * Generic fixed-window limiter: `limit` hits per `windowSeconds` per key.
 */
export async function windowLimiter(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`

  // INCR first — atomic, so concurrent requests each get a distinct count
  // and none can slip past the limit via a read-then-write race.
  const newCount = await redis.incr(redisKey)

  if (newCount === 1) {
    await redis.expire(redisKey, windowSeconds)
  }

  let ttlVal = await redis.ttl(redisKey)

  // Heal a key left without expiry (process died between INCR and EXPIRE)
  if (ttlVal === -1) {
    await redis.expire(redisKey, windowSeconds)
    ttlVal = windowSeconds
  }

  return {
    success: newCount <= limit,
    limit,
    remaining: Math.max(0, limit - newCount),
    reset: ttlVal > 0 ? ttlVal : windowSeconds
  }
}
