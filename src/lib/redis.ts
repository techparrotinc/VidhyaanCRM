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
    const val = await this.get(key)
    const num = val ? parseInt(val) + 1 : 1
    await this.set(key, String(num))
    return num
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
    this.client = new UpstashRedis({ url, token })
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

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key)
  }
}

let redis: UpstashRedisWrapper | MemoryRedisMock

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new UpstashRedisWrapper(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
} else {
  const globalRef = globalThis as any
  if (!globalRef.redisMock) {
    globalRef.redisMock = new MemoryRedisMock()
  }
  redis = globalRef.redisMock
}

export { redis }
