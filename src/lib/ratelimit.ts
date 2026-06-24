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
  const limit = 3
  const windowSeconds = 15 * 60 // 15 minutes
  const redisKey = `ratelimit:${key}`

  // Fetch current request count
  const currentVal = await redis.get(redisKey)
  const currentCount = currentVal ? parseInt(currentVal) : 0

  if (currentCount >= limit) {
    const ttlVal = await redis.ttl(redisKey)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: ttlVal > 0 ? ttlVal : windowSeconds
    }
  }

  // Increment the request count
  const newCount = await redis.incr(redisKey)
  
  // Set expiration if this is the first request in the window
  if (newCount === 1) {
    await redis.set(redisKey, '1', 'EX', windowSeconds)
  }

  const ttlVal = await redis.ttl(redisKey)

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - newCount),
    reset: ttlVal > 0 ? ttlVal : windowSeconds
  }
}
