import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

/**
 * Peek (not consume) a parked Google identity so the complete-signup page can
 * show the verified name/email. The token itself is the security boundary
 * (256-bit, 10-min TTL, single-use at completion).
 */
export async function GET(req: NextRequest) {
  try {
    const t = req.nextUrl.searchParams.get('t')
    if (!t || !/^[a-f0-9]{64}$/.test(t)) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
    }
    const raw = await redis.get(`google_pending:${t}`)
    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'This sign-in link has expired. Please try Google sign-in again.' },
        { status: 410 }
      )
    }
    const payload = JSON.parse(raw) as { sub: string; email: string; name: string }
    return NextResponse.json({
      success: true,
      data: { email: payload.email, name: payload.name }
    })
  } catch (e) {
    console.error('google/pending error:', e)
    return NextResponse.json({ success: false, error: 'Failed to load sign-in details' }, { status: 500 })
  }
}
