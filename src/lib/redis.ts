import { Redis as UpstashRedis } from '@upstash/redis'

class MemoryRedisMock {
  private store = new Map<string, { value: string; expiresAt: number | null }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, mode?: 'EX', ttl?: number): Promise<'OK'> {
    let expiresAt: number | null = null
    if (mode === 'EX' && ttl) {
      expiresAt = Date.now() + ttl * 1000
    }
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key)
    this.store.delete(key)
    return existed ? 1 : 0
  }

  async incr(key: string): Promise<number> {
    const item = this.store.get(key)
    const expired = item?.expiresAt && Date.now() > item.expiresAt
    const num = item && !expired ? parseInt(item.value) + 1 : 1
    // Preserve existing TTL (Redis INCR does not touch expiry)
    this.store.set(key, {
      value: String(num),
      expiresAt: item && !expired ? item.expiresAt : null
    })
    return num
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key)
    if (!item) return 0
    item.expiresAt = Date.now() + seconds * 1000
    return 1
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key)
    if (!item) return -2
    if (item.expiresAt === null) return -1
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000)
    if (remaining <= 0) {
      this.store.delete(key)
      return -2
    }
    return remaining
  }
}

class UpstashRedisWrapper {
  private client: UpstashRedis

  constructor(url: string, token: string) {
    this.client = new UpstashRedis({
      url,
      token,
      automaticDeserialization: false
    })
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.get<string>(key)
    return result ?? null
  }

  async set(key: string, value: string, mode?: 'EX', ttl?: number): Promise<'OK'> {
    if (mode === 'EX' && ttl) {
      await this.client.set(key, value, { ex: ttl })
    } else {
      await this.client.set(key, value)
    }
    return 'OK'
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key)
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds)
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key)
  }
}

// In production a per-instance in-memory mock silently breaks rate limits,
// session revocation, and cache coherence across instances — so refuse to
// run without a real Redis. Throws lazily (on first use, not import) so
// builds without runtime env vars still compile.
class UnconfiguredRedis {
  private fail(): never {
    throw new Error(
      'Redis is not configured: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. ' +
      'The in-memory fallback is disabled in production.'
    )
  }
  async get(_key: string): Promise<string | null> { this.fail() }
  async set(_key: string, _value: string, _mode?: 'EX', _ttl?: number): Promise<'OK'> { this.fail() }
  async del(_key: string): Promise<number> { this.fail() }
  async incr(_key: string): Promise<number> { this.fail() }
  async expire(_key: string, _seconds: number): Promise<number> { this.fail() }
  async ttl(_key: string): Promise<number> { this.fail() }
}

let redis: UpstashRedisWrapper | MemoryRedisMock | UnconfiguredRedis

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new UpstashRedisWrapper(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
} else if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MEMORY_REDIS) {
  redis = new UnconfiguredRedis()
} else {
  const globalRef = globalThis as any
  if (!globalRef.redisMock) {
    globalRef.redisMock = new MemoryRedisMock()
  }
  redis = globalRef.redisMock
}

export { redis }
