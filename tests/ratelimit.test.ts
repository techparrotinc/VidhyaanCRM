import { describe, it, expect } from 'vitest'
import { otpSendLimiter } from '@/lib/ratelimit'

// Runs against the in-memory Redis mock (no Upstash env in tests).

describe('otpSendLimiter', () => {
  it('allows 3 sends then blocks the 4th', async () => {
    const key = `test-${Date.now()}`
    const r1 = await otpSendLimiter(key)
    const r2 = await otpSendLimiter(key)
    const r3 = await otpSendLimiter(key)
    const r4 = await otpSendLimiter(key)

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    expect(r3.success).toBe(true)
    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
    expect(r4.reset).toBeGreaterThan(0)
  })

  it('decrements remaining monotonically', async () => {
    const key = `test-mono-${Date.now()}`
    expect((await otpSendLimiter(key)).remaining).toBe(2)
    expect((await otpSendLimiter(key)).remaining).toBe(1)
    expect((await otpSendLimiter(key)).remaining).toBe(0)
  })

  it('is race-safe: concurrent burst never exceeds limit', async () => {
    const key = `test-race-${Date.now()}`
    const results = await Promise.all(
      Array.from({ length: 10 }, () => otpSendLimiter(key))
    )
    const allowed = results.filter(r => r.success).length
    expect(allowed).toBe(3)
  })

  it('keeps window TTL across increments', async () => {
    const key = `test-ttl-${Date.now()}`
    await otpSendLimiter(key)
    const r2 = await otpSendLimiter(key)
    // Before the fix, INCR via the mock wiped expiry; TTL must survive
    expect(r2.reset).toBeGreaterThan(0)
    expect(r2.reset).toBeLessThanOrEqual(15 * 60)
  })
})
