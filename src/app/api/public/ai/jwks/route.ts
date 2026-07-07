import { NextResponse } from 'next/server'
import { jwks } from '@/lib/ai/token'

// Public JWKS for AI Gateway token verification. Contains only public key
// material. Cached hard — gateway refreshes every 10 min; rotation keeps the
// old kid published until in-flight tokens (5 min TTL) expire.
export async function GET() {
  try {
    const doc = await jwks()
    return NextResponse.json(doc, {
      headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600' }
    })
  } catch {
    // Key not configured in this environment — 404 rather than leaking detail
    return NextResponse.json({ error: 'not configured' }, { status: 404 })
  }
}
